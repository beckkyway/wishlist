import uuid
import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/auth/register",
        json={"email": f"{uid}@example.com", "password": "secret123", "name": "Alice"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    uid = uuid.uuid4().hex[:8]
    data = {"email": f"{uid}@example.com", "password": "secret123", "name": "Bob"}
    await client.post("/auth/register", json=data)
    resp = await client.post("/auth/register", json=data)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client, user_data):
    await client.post("/auth/register", json=user_data)
    resp = await client.post(
        "/auth/login",
        json={"email": user_data["email"], "password": user_data["password"]},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, user_data):
    await client.post("/auth/register", json=user_data)
    resp = await client.post(
        "/auth/login",
        json={"email": user_data["email"], "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me(client, auth_headers, user_data):
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == user_data["email"]
    assert resp.json()["name"] == user_data["name"]


@pytest.mark.asyncio
async def test_me_no_token(client):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_invalid_token(client):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_me(client, auth_headers):
    resp = await client.delete("/auth/me", headers=auth_headers)
    assert resp.status_code == 204
    # Token should no longer work after soft-delete
    resp2 = await client.get("/auth/me", headers=auth_headers)
    assert resp2.status_code == 401
