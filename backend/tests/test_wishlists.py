import pytest


@pytest.mark.asyncio
async def test_create_wishlist(client, auth_headers):
    resp = await client.post(
        "/wishlists",
        json={"title": "Birthday", "description": "My birthday list"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Birthday"
    assert data["description"] == "My birthday list"
    assert "share_token" in data
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_wishlists(client, auth_headers):
    await client.post("/wishlists", json={"title": "List 1"}, headers=auth_headers)
    await client.post("/wishlists", json={"title": "List 2"}, headers=auth_headers)
    resp = await client.get("/wishlists", headers=auth_headers)
    assert resp.status_code == 200
    titles = [w["title"] for w in resp.json()]
    assert "List 1" in titles
    assert "List 2" in titles


@pytest.mark.asyncio
async def test_get_wishlist(client, auth_headers, wishlist):
    resp = await client.get(f"/wishlists/{wishlist['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == wishlist["id"]


@pytest.mark.asyncio
async def test_get_wishlist_not_found(client, auth_headers):
    resp = await client.get("/wishlists/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_wishlist_wrong_user(client, wishlist):
    import uuid
    uid = uuid.uuid4().hex[:8]
    resp2 = await client.post(
        "/auth/register",
        json={"email": f"{uid}@ex.com", "password": "pw", "name": "Other"},
    )
    token2 = resp2.json()["access_token"]
    resp = await client.get(
        f"/wishlists/{wishlist['id']}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_wishlist(client, auth_headers, wishlist):
    resp = await client.patch(
        f"/wishlists/{wishlist['id']}",
        json={"title": "Updated Title", "is_active": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"
    assert resp.json()["is_active"] is False


@pytest.mark.asyncio
async def test_delete_wishlist(client, auth_headers):
    resp = await client.post("/wishlists", json={"title": "To Delete"}, headers=auth_headers)
    wid = resp.json()["id"]
    resp = await client.delete(f"/wishlists/{wid}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/wishlists/{wid}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_wishlist_stats_empty(client, auth_headers, wishlist):
    resp = await client.get(f"/wishlists/{wishlist['id']}/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_items"] == 0
    assert data["available"] == 0
    assert data["total_collected_amount"] == 0.0


@pytest.mark.asyncio
async def test_wishlist_stats_with_items(client, auth_headers, wishlist):
    wid = wishlist["id"]
    await client.post(f"/wishlists/{wid}/items", json={"title": "Item A"}, headers=auth_headers)
    await client.post(f"/wishlists/{wid}/items", json={"title": "Item B"}, headers=auth_headers)
    resp = await client.get(f"/wishlists/{wid}/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_items"] >= 2
    assert data["available"] >= 2
