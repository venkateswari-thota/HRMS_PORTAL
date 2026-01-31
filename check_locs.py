import asyncio
from backend.database import init_db
from backend.models import WorkLocation

async def check():
    await init_db()
    locs = await WorkLocation.find_all().to_list()
    print(f"FOUND_LOCATIONS: {len(locs)}")
    for l in locs:
        print(f" - {l.name}: {l.latitude}, {l.longitude}")

if __name__ == "__main__":
    asyncio.run(check())
