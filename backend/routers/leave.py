from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from logger import log_debug
from typing import List
from datetime import datetime
from models import LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, Employee, LeaveBalance, Holiday, Admin
from email_utils import send_leave_request_email, send_leave_status_email
from utils import SECRET_KEY, ALGORITHM
from jose import jwt
from fastapi import Header

router = APIRouter(prefix="/leave", tags=["Leave Management"])

# --- Helper Dependencies ---

async def get_current_admin_email(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        email = payload.get("sub")
        if not email:
             raise HTTPException(status_code=401, detail="Invalid Token")
        return email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token")

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

    # Fetch holidays once for efficiency
    holidays = await Holiday.find().to_list()
    holiday_dates = {h.date for h in holidays}
    from datetime import timedelta

    results = []
    for display_name, key in categories.items():
        # Fetch all approved leaves for this category
        approved_leaves = await LeaveApproved.find(
            LeaveApproved.emp_id == emp_id,
            LeaveApproved.leave_type == display_name
        ).to_list()

        # Calculate total work days used
        total_used_days = 0
        for leave in approved_leaves:
            curr = datetime.strptime(leave.from_date, "%Y-%m-%d")
            end = datetime.strptime(leave.to_date, "%Y-%m-%d")
            
            while curr <= end:
                curr_str = curr.strftime("%Y-%m-%d")
                is_sunday = curr.weekday() == 6
                is_holiday = curr_str in holiday_dates
                
                if not is_sunday and not is_holiday:
                    total_used_days += 1
                curr += timedelta(days=1)

        granted_val = granted_data.get(key, 0)
        results.append({
            "category": display_name,
            "granted": granted_val,
            "used": total_used_days,
            "balance": granted_val - total_used_days
        })

    return results

@router.post("/apply")
async def apply_leave(data: dict, background_tasks: BackgroundTasks):
    from datetime import timedelta
    
    emp_id = data.get("emp_id")
    from_date_str = data.get("from_date")
    to_date_str = data.get("to_date")
    leave_type = data.get("leave_type")
    
    if not all([emp_id, from_date_str, to_date_str, leave_type]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    from_date = datetime.strptime(from_date_str, "%Y-%m-%d")
    to_date = datetime.strptime(to_date_str, "%Y-%m-%d")

    # 1. Fetch data for validation
    holidays = await Holiday.find().to_list()
    holiday_dates = {h.date: h.reason for h in holidays}
    
    pending = await LeaveRequest.find(LeaveRequest.emp_id == emp_id).to_list()
    approved = await LeaveApproved.find(LeaveApproved.emp_id == emp_id).to_list()
    
    # 2. Map leave type to balance field
    categories = {
        "Optional Holiday": "optional_holiday",
        "Comp Off": "comp_off",
        "Paternity Leave": "paternity_leave",
        "Work From Home - Contract": "wfh_contract",
        "Paid Leave": "paid_leave"
    }
    
    balance_field = categories.get(leave_type)
    emp_balance = await LeaveBalance.find_one(LeaveBalance.emp_id == emp_id)
    
    # 3. Iterate through requested range to count actual leave days and check overlaps
    curr = from_date
    requested_work_days = 0
    while curr <= to_date:
        curr_str = curr.strftime("%Y-%m-%d")
        
        # Skip Sundays and Holidays for both counting and overlap checks
        is_sunday = curr.weekday() == 6
        is_holiday = curr_str in holiday_dates
        
        if not is_sunday and not is_holiday:
            requested_work_days += 1
            
            # Check Overlap only on work days
            for l in (pending + approved):
                if l.from_date <= curr_str <= l.to_date:
                    raise HTTPException(status_code=400, detail=f"The date {curr_str} is already covered by another leave request.")
                
        curr += timedelta(days=1)

    if requested_work_days == 0:
        raise HTTPException(status_code=400, detail="The selected date range only contains non-working days (Sundays/Holidays).")

    # 4. Balance Check (if applicable)
    if balance_field:
        if not emp_balance:
            raise HTTPException(status_code=400, detail=f"No leave balance set for this employee. Cannot apply for {leave_type}.")
        
        granted_val = getattr(emp_balance, balance_field, 0)
        # Calculate used
        used_count = await LeaveApproved.find(
            LeaveApproved.emp_id == emp_id,
            LeaveApproved.leave_type == leave_type
        ).count()
        
        # Check pending requests for this type to prevent double dipping
        pending_count = 0
        for p in pending:
            if p.leave_type == leave_type:
                # Count days in pending (rough estimate for simplicity)
                p_from = datetime.strptime(p.from_date, "%Y-%m-%d")
                p_to = datetime.strptime(p.to_date, "%Y-%m-%d")
                p_curr = p_from
                while p_curr <= p_to:
                    if p_curr.weekday() != 6 and p_curr.strftime("%Y-%m-%d") not in holiday_dates:
                        pending_count += 1
                    p_curr += timedelta(days=1)

        available = granted_val - used_count - pending_count
        if available < requested_work_days:
            raise HTTPException(status_code=400, detail=f"Insufficient balance. You have {available} days available for {leave_type}, but requested {requested_work_days} work days.")

    # Fetch employee for name
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    emp_name = emp.name if emp else "Unknown Employee"

    # All checks passed
    req = LeaveRequest(**data, emp_name=emp_name)
    await req.create()

    # Email Logic
    try:
        admin = await Admin.find_one()
        admin_email = admin.email if admin else "admin@pragyatmika.com"
        
        if emp:
            background_tasks.add_task(
                send_leave_request_email,
                emp_name=emp.name,
                admin_email=admin_email,
                emp_id=emp.emp_id,
                reply_to_email=emp.email,
                leave_type=data["leave_type"],
                from_date=data["from_date"],
                to_date=data["to_date"],
                reason=data["reason"]
            )
    except Exception as e:
        print(f"⚠️ Failed to queue leave request email: {e}")

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
        emp_name=req.emp_name, # Transfer name
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

@router.patch("/admin/requests/{request_id}")
async def admin_update_leave_request(request_id: str, data: dict, admin_email: str = Depends(get_current_admin_email)):
    req = await LeaveRequest.get(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Update fields if provided
    if "from_date" in data:
        req.from_date = data["from_date"]
    if "to_date" in data:
        req.to_date = data["to_date"]
    if "reason" in data:
        req.reason = data["reason"]
    if "leave_type" in data:
        req.leave_type = data["leave_type"]
    if "from_session" in data:
        req.from_session = data["from_session"]
    if "to_session" in data:
        req.to_session = data["to_session"]
        
    await req.save()
    return {"message": "Leave request updated successfully"}

@router.post("/admin/review")
async def review_leave(data: dict, background_tasks: BackgroundTasks, admin_email: str = Depends(get_current_admin_email)):
    # data: { request_id, action: 'APPROVE' | 'REJECT' }
    req = await LeaveRequest.get(data["request_id"])
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Get Employee for notification
    emp = await Employee.find_one(Employee.emp_id == req.emp_id)

    status = ""
    # ... (status update logic)
    if data["action"] == "APPROVE":
        approved = LeaveApproved(
            emp_id=req.emp_id,
            emp_name=req.emp_name, # Transfer name
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
        status = "APPROVED"
    
    elif data["action"] == "REJECT":
        rejected = LeaveRejected(
            emp_id=req.emp_id,
            emp_name=req.emp_name, # Transfer name
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
        status = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid Action")

    # Email logic for status update
    if emp:
        # Extract details before potential deletion or for clarity
        leave_info = {
            "type": req.leave_type,
            "from": req.from_date,
            "to": req.to_date
        }
        
        log_debug(f"📧 Queueing status email: {status} for {emp.email} (Admin: {admin_email})")
        background_tasks.add_task(
            send_leave_status_email,
            recipient_email=emp.email,
            emp_name=emp.name,
            admin_email=admin_email,
            status=status,
            leave_type=leave_info["type"],
            from_date=leave_info["from"],
            to_date=leave_info["to"]
        )
    else:
        log_debug(f"⚠️ Cannot send status email: Employee for {req.emp_id} not found")

    await req.delete()
    return {"message": f"Leave {status.capitalize()} Successfully"}

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
        # 1. UPSERT logic (Update or Insert) - No more full-month deletions
        # This allows the frontend to send an empty form for ADDING without wiping existing data.
        holidays_to_save = holidays_list
        
        # 2. Process the provided list
        for h in holidays_to_save:
            # Simple check if already exists (safeguard)
            exists = await Holiday.find_one(Holiday.date == h["date"])
            if exists:
                exists.reason = h["reason"]
                await exists.save()
            else:
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
