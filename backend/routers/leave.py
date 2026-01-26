from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from backend.models import LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, Employee, LeaveBalance, Holiday

router = APIRouter(prefix="/leave", tags=["Leave Management"])

# --- Leave Balances Endpoints ---

@router.post("/admin/balances/setup")
async def setup_balances(data: dict):
    # data: { emp_id, loss_of_pay, optional_holiday, comp_off, paternity_leave, wfh_contract, paid_leave }
    emp_id = data.get("emp_id")
    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    
    # Check if employee exists
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = await LeaveBalance.find_one(LeaveBalance.emp_id == emp_id)
    if existing:
        # Update
        for key, val in data.items():
            if key != "emp_id":
                setattr(existing, key, val)
        existing.last_updated = datetime.now()
        await existing.save()
    else:
        # Create
        new_balance = LeaveBalance(**data)
        await new_balance.create()
    
    return {"message": f"Balances updated for {emp_id}"}

@router.get("/admin/balances/all")
async def get_all_balances(emp_id: str = None):
    try:
        query = {}
        if emp_id:
            query = {"emp_id": emp_id}
        
        balances = await LeaveBalance.find(query).to_list()
        return balances
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/balances/{emp_id}")
async def delete_balances(emp_id: str):
    try:
        res = await LeaveBalance.find_one(LeaveBalance.emp_id == emp_id).delete()
        if not res:
            raise HTTPException(status_code=404, detail="Balance record not found")
        return {"message": f"Balances for {emp_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/balances/{emp_id}")
async def get_admin_emp_balance(emp_id: str):
    try:
        balance = await LeaveBalance.find_one(LeaveBalance.emp_id == emp_id)
        if not balance:
            raise HTTPException(status_code=404, detail="Leave balance record not found")
        return balance
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balances/{emp_id}")
async def get_emp_balances(emp_id: str):
    # Fetch granted balances
    granted = await LeaveBalance.find_one(LeaveBalance.emp_id == emp_id)
    if not granted:
        # Return zeros if not set
        granted_data = {
            "loss_of_pay": 0, "optional_holiday": 0, "comp_off": 0, 
            "paternity_leave": 0, "wfh_contract": 0, "paid_leave": 0
        }
    else:
        granted_data = granted.dict()

    # Map display names to model keys
    categories = {
        "Loss of Pay": "loss_of_pay",
        "Optional Holiday": "optional_holiday",
        "Comp Off": "comp_off",
        "Paternity Leave": "paternity_leave",
        "Work From Home - Contract": "wfh_contract",
        "Paid Leave": "paid_leave"
    }

    results = []
    for display_name, key in categories.items():
        # Count approved leaves for this category
        used_count = await LeaveApproved.find(
            LeaveApproved.emp_id == emp_id,
            LeaveApproved.leave_type == display_name
        ).count()

        granted_val = granted_data.get(key, 0)
        results.append({
            "category": display_name,
            "granted": granted_val,
            "used": used_count,
            "balance": granted_val - used_count
        })

    return results

@router.post("/apply")
async def apply_leave(data: dict):
    # data: { emp_id, leave_type, from_date, to_date, from_session, to_session, reason }
    req = LeaveRequest(**data)
    await req.create()
    return {"message": "Leave application submitted successfully", "id": str(req.id)}

@router.get("/pending")
async def get_pending_leaves(emp_id: str):
    leaves = await LeaveRequest.find(LeaveRequest.emp_id == emp_id).to_list()
    # Serialize to include string ID
    results = []
    for l in leaves:
        d = l.dict()
        d["id"] = str(l.id)
        results.append(d)
    # Sort by applied_on desc
    results.sort(key=lambda x: x["applied_on"], reverse=True)
    return results

@router.get("/history")
async def get_leave_history(emp_id: str):
    approved = await LeaveApproved.find(LeaveApproved.emp_id == emp_id).to_list()
    rejected = await LeaveRejected.find(LeaveRejected.emp_id == emp_id).to_list()
    withdrawn = await LeaveWithdrawn.find(LeaveWithdrawn.emp_id == emp_id).to_list()
    
    combined = []
    for l in (approved + rejected + withdrawn):
        d = l.dict()
        d["id"] = str(l.id)
        combined.append(d)
        
    combined.sort(key=lambda x: x["applied_on"], reverse=True)
    return combined

@router.post("/withdraw")
async def withdraw_leave(data: dict):
    # data: { leave_id }
    req = await LeaveRequest.get(data["leave_id"])
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Move to withdrawn
    withdrawn = LeaveWithdrawn(
        emp_id=req.emp_id,
        leave_type=req.leave_type,
        from_date=req.from_date,
        to_date=req.to_date,
        from_session=req.from_session,
        to_session=req.to_session,
        reason=req.reason,
        applied_on=req.applied_on,
        status="WITHDRAWN"
    )
    await withdrawn.create()
    await req.delete()
    return {"message": "Leave request withdrawn successfully"}

# Admin Endpoints
@router.get("/admin/requests")
async def admin_get_leave_requests():
    leaves = await LeaveRequest.find().to_list()
    results = []
    for l in leaves:
        d = l.dict()
        d["id"] = str(l.id)
        results.append(d)
    return results

@router.post("/admin/review")
async def review_leave(data: dict):
    # data: { request_id, action: 'APPROVE' | 'REJECT' }
    req = await LeaveRequest.get(data["request_id"])
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if data["action"] == "APPROVE":
        approved = LeaveApproved(
            emp_id=req.emp_id,
            leave_type=req.leave_type,
            from_date=req.from_date,
            to_date=req.to_date,
            from_session=req.from_session,
            to_session=req.to_session,
            reason=req.reason,
            applied_on=req.applied_on,
            status="APPROVED"
        )
        await approved.create()
        await req.delete()
        return {"message": "Leave Approved Successfully"}
    
    elif data["action"] == "REJECT":
        rejected = LeaveRejected(
            emp_id=req.emp_id,
            leave_type=req.leave_type,
            from_date=req.from_date,
            to_date=req.to_date,
            from_session=req.from_session,
            to_session=req.to_session,
            reason=req.reason,
            applied_on=req.applied_on,
            status="REJECTED"
        )
        await rejected.create()
        await req.delete()
        return {"message": "Leave Rejected Successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid Action")

# --- Holiday Calendar Endpoints (at bottom to avoid shadowing) ---

@router.post("/admin/holidays/setup")
async def setup_holidays(data: dict):
    # data: { year: 2026, month: 1 (optional), holidays: [ { date: "2026-01-01", reason: "New Year" }, ... ] }
    year = data.get("year")
    month = data.get("month") # 1-12
    holidays_list = data.get("holidays", [])
    
    if not year:
        raise HTTPException(status_code=400, detail="Year is required")

    try:
        if month:
            # Surgical operation for a specific month
            month_str = f"{year}-{int(month):02d}-"
            
            # 1. Delete existing records for THIS month only using raw filter for regex
            await Holiday.find({"year": int(year), "date": {"$regex": f"^{month_str}"}}).delete()
            
            # 2. Filter list to ONLY allow dates belonging to this month (safety check)
            holidays_to_save = [h for h in holidays_list if h["date"].startswith(month_str)]
        else:
            # Clear entire year if no month is specified (Bulk Setup Mode)
            await Holiday.find(Holiday.year == int(year)).delete()
            holidays_to_save = holidays_list
        
        # Batch create the validated list
        for h in holidays_to_save:
            new_h = Holiday(
                date=h["date"],
                reason=h["reason"],
                year=int(year)
            )
            await new_h.create()
        
        return {"message": "Holidays synchronized successfully"}
    except Exception as e:
        import traceback
        print(f"❌ Error setting up holidays: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/handled-history")
async def get_handled_history(emp_id: str = None):
    try:
        # Aggregation Logic
        handled_list = []
        
        # Determine query filters
        query = {}
        if emp_id:
            query = {"emp_id": emp_id}
            
        # Fetch from approved, rejected, and withdrawn 
        # (Using raw dictionary find for the union compatibility if needed, 
        # but Beanie models are fine too)
        
        approved = await LeaveApproved.find(query).to_list()
        rejected = await LeaveRejected.find(query).to_list()
        withdrawn = await LeaveWithdrawn.find(query).to_list()
        
        # Merge with status tags
        for item in approved:
            doc = item.dict()
            doc["final_status"] = "APPROVED"
            doc["action_date"] = doc.get("approved_at")
            handled_list.append(doc)
            
        for item in rejected:
            doc = item.dict()
            doc["final_status"] = "REJECTED"
            doc["action_date"] = doc.get("rejected_at")
            handled_list.append(doc)
            
        for item in withdrawn:
            doc = item.dict()
            doc["final_status"] = "WITHDRAWN"
            doc["action_date"] = doc.get("withdrawn_at")
            handled_list.append(doc)
            
        # Sort by action_date (or fallback to applied_on if action_date missing)
        def get_date(x):
            return x.get("action_date") or x.get("applied_on") or datetime.min
            
        handled_list.sort(key=get_date, reverse=True)
        
        return handled_list
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/holidays")
async def get_holidays(year: int):
    try:
        holidays = await Holiday.find(Holiday.year == int(year)).to_list()
        # Sort by date
        holidays.sort(key=lambda x: x.date)
        return holidays
    except Exception as e:
        print(f"❌ Error fetching holidays: {e}")
        return []
