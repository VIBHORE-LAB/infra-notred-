"""
Seed script — talks to the running Flask server at http://127.0.0.1:5000
Backfills data for user: onlyvibhore@gmail.com

Usage: python3 seed_data.py
"""

import requests
import json
import sys

BASE = "http://127.0.0.1:5000/infrared/api/v1"
OWNER_EMAIL = "onlyvibhore@gmail.com"
OWNER_PASSWORD = "Admin@123"

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("  InfraRed Seed Script — backfilling data")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

# 1. Login
print(f"[1/6] Logging in as {OWNER_EMAIL}...")
login_res = requests.post(f"{BASE}/user/login", json={
    "req": {"signature": "seed_login"},
    "payload": {"email": OWNER_EMAIL, "password": OWNER_PASSWORD}
})

if login_res.status_code != 200:
    print(f"  ❌ Login failed: {login_res.json()}")
    sys.exit(1)

login_data = login_res.json()
token = login_data["data"]["token"]
user  = login_data["data"]["user"]
print(f"  ✅ Logged in: {user['firstName']} {user['lastName']} (role: {user['role']})")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

# 2. Company setup
print("\n[2/6] Setting up company...")
company_code = "EZ8I2N" # Hardcoded for this specific user's state, or we fetch it.

# Try creating a company (just in case)
create_co = requests.post(f"{BASE}/company/create", json={
    "req": {"signature": "seed_create_company"},
    "payload": {
        "name": "InfraRed Projects Pvt Ltd",
        "description": "National infrastructure monitoring and delivery company",
        "address": "12 Industrial Park, Sector 45, Gurugram",
        "contactNumber": "+91-9876543210",
        "domain": "Other"
    }
}, headers=headers)

if create_co.status_code in (200, 201):
    company_code = create_co.json()["data"]["company"]["code"]
    print(f"  ✅ Company created — code: {company_code}")
elif "already exists" in create_co.text:
    print(f"  ✅ Using existing company — code: {company_code}")
else:
    print(f"  ⚠️  Could not create/find company: {create_co.text}")

headers_with_cc = {**headers, "x-company-code": company_code}

# 3. Seed Projects
PROJECTS = [
    {
        "name": "NH-48 Highway Widening",
        "description": "Widening of National Highway 48 from 4 lanes to 6 lanes across 42 km stretch.",
        "estimatedBudget": 85000000,
        "fundingSource": "Ministry of Road Transport & Highways",
        "startDate": "2025-01-15",
        "endDate": "2026-12-31",
        "deadline": "2026-11-30",
        "status": "In Progress",
        "projectType": "Road",
        "city": "Gurugram",
        "state": "Haryana",
        "country": "India",
        "zipCode": "122001",
        "areaInSqFt": 2200000,
        "teamsize": 120,
        "credit": 50000000,
        "expenditure": 18500000,
    },
    {
        "name": "Yamuna River Flyover Bridge",
        "description": "Construction of a 1.2 km cable-stayed bridge over the Yamuna River.",
        "estimatedBudget": 220000000,
        "fundingSource": "State Infrastructure Development Fund",
        "startDate": "2024-06-01",
        "endDate": "2027-05-31",
        "deadline": "2027-03-31",
        "status": "In Progress",
        "projectType": "Bridge",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "country": "India",
        "zipCode": "201301",
        "areaInSqFt": 65000,
        "teamsize": 75,
        "credit": 120000000,
        "expenditure": 45000000,
    }
]

MILESTONES_TEMPLATE = [
    [
        {"title": "Land Acquisition", "description": "Complete clearances.", "startDate": "2025-01-15", "endDate": "2025-04-30", "status": "Completed", "progress": 100},
        {"title": "Earthworks", "description": "Grading and leveling.", "startDate": "2025-05-01", "endDate": "2025-10-31", "status": "Completed", "progress": 100},
        {"title": "Carriageway", "description": "Laying bitumen.", "startDate": "2025-11-01", "endDate": "2026-07-31", "status": "In Progress", "progress": 62},
    ],
    [
        {"title": "Piling Work", "description": "Deep piling.", "startDate": "2024-06-01", "endDate": "2025-02-28", "status": "Completed", "progress": 100},
        {"title": "Pylon Construction", "description": "Erection of pylons.", "startDate": "2025-03-01", "endDate": "2025-11-30", "status": "In Progress", "progress": 78},
    ]
]

UPDATES_TEMPLATE = [
    [
        {"title": "Earthworks Complete", "description": "Phase 1 done.", "updateType": "Milestone"},
        {"title": "Monsoon Delay", "description": "Halted for 3 weeks.", "updateType": "Delay"},
    ],
    [
        {"title": "Pylon 1 Complete", "description": "Reached full height.", "updateType": "Milestone"},
    ]
]

print("\n[3/6] Creating projects, milestones, funds and updates...")

for i, proj in enumerate(PROJECTS):
    # Check if project exists to avoid too many duplicates
    # For now, let's just create them.
    payload = {k: v for k, v in proj.items() if k not in ("credit", "expenditure")}
    res = requests.post(f"{BASE}/projects/create", json={
        "req": {"signature": "seed_create_project"},
        "payload": payload
    }, headers=headers_with_cc)
    
    if res.status_code not in (200, 201):
        print(f"  ❌ Failed to create project: {res.json().get('error', res.text)}")
        continue
    
    project_id = res.json()["data"]["project"]["id"]
    print(f"  ✅ Project: {proj['name']} ({project_id})")

    # Funds
    requests.post(f"{BASE}/funds/create", json={
        "signature": "seed_fund", "payload": {"projectId": project_id, "type": "Credit", "amount": proj["credit"], "purpose": "Allocation"}
    }, headers=headers_with_cc)
    requests.post(f"{BASE}/funds/create", json={
        "signature": "seed_fund", "payload": {"projectId": project_id, "type": "Expenditure", "amount": proj["expenditure"], "purpose": "Procurement"}
    }, headers=headers_with_cc)
    print(f"    ✅ Funds seeded")

    # Milestones
    for ms in MILESTONES_TEMPLATE[i]:
        res_ms = requests.post(f"{BASE}/milestones/create", json={
            "signature": "seed_ms", "payload": {**ms, "projectId": project_id}
        }, headers=headers_with_cc)
        if res_ms.status_code not in (200, 201):
            print(f"    ❌ Milestone '{ms['title']}' failed: {res_ms.json().get('error', res_ms.status_code)}")
        else:
            print(f"    ✅ Milestone: {ms['title']}")

    # Updates
    for upd in UPDATES_TEMPLATE[i]:
        requests.post(f"{BASE}/project-updates/create", data={
            "req": json.dumps({"signature": "seed_upd"}),
            "payload": json.dumps({**upd, "projectId": project_id})
        }, headers={"Authorization": f"Bearer {token}", "x-company-code": company_code})
    print(f"    ✅ Updates seeded")

print("\n✅ Seed complete!")
