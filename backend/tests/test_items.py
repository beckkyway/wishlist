import pytest


@pytest.mark.asyncio
async def test_create_item(client, auth_headers, wishlist):
    resp = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Book", "price": 500.0, "currency": "RUB", "priority": "must_have"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Book"
    assert data["price"] == 500.0
    assert data["status"] == "available"
    assert data["priority"] == "must_have"


@pytest.mark.asyncio
async def test_create_group_gift_item(client, auth_headers, wishlist):
    resp = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Bike", "is_group_gift": True, "target_amount": 30000.0},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["is_group_gift"] is True
    assert data["status"] == "collecting"


@pytest.mark.asyncio
async def test_list_items(client, auth_headers, wishlist):
    wid = wishlist["id"]
    await client.post(f"/wishlists/{wid}/items", json={"title": "Item X"}, headers=auth_headers)
    await client.post(f"/wishlists/{wid}/items", json={"title": "Item Y"}, headers=auth_headers)
    resp = await client.get(f"/wishlists/{wid}/items", headers=auth_headers)
    assert resp.status_code == 200
    titles = [i["title"] for i in resp.json()]
    assert "Item X" in titles
    assert "Item Y" in titles


@pytest.mark.asyncio
async def test_list_items_hides_reserved_status_from_owner(client, auth_headers, wishlist):
    """Owner should see reserved items as 'available' (reservation is a surprise)."""
    wid = wishlist["id"]
    r = await client.post(
        f"/wishlists/{wid}/items", json={"title": "Gift"}, headers=auth_headers
    )
    item_id = r.json()["id"]

    # Someone reserves the item
    await client.post(
        f"/items/{item_id}/reserve",
        json={"reserver_name": "Friend"},
    )

    resp = await client.get(f"/wishlists/{wid}/items", headers=auth_headers)
    assert resp.status_code == 200
    gift = next(i for i in resp.json() if i["id"] == item_id)
    assert gift["status"] == "available"


@pytest.mark.asyncio
async def test_deleted_items_not_shown_to_owner(client, auth_headers, wishlist):
    """Bug fix: soft-deleted items must NOT appear in list_items."""
    wid = wishlist["id"]
    r = await client.post(
        f"/wishlists/{wid}/items", json={"title": "Will Be Deleted"}, headers=auth_headers
    )
    item_id = r.json()["id"]

    # Soft-delete the item
    del_resp = await client.delete(
        f"/wishlists/{wid}/items/{item_id}", headers=auth_headers
    )
    assert del_resp.status_code == 204

    # Must not appear in list
    resp = await client.get(f"/wishlists/{wid}/items", headers=auth_headers)
    assert resp.status_code == 200
    ids = [i["id"] for i in resp.json()]
    assert item_id not in ids


@pytest.mark.asyncio
async def test_update_item(client, auth_headers, wishlist, item):
    resp = await client.patch(
        f"/wishlists/{wishlist['id']}/items/{item['id']}",
        json={"title": "Updated Item", "price": 999.0},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Item"
    assert resp.json()["price"] == 999.0


@pytest.mark.asyncio
async def test_delete_item(client, auth_headers, wishlist, item):
    resp = await client.delete(
        f"/wishlists/{wishlist['id']}/items/{item['id']}", headers=auth_headers
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_create_item_wrong_wishlist_owner(client, wishlist):
    import uuid
    uid = uuid.uuid4().hex[:8]
    r = await client.post(
        "/auth/register",
        json={"email": f"{uid}@ex.com", "password": "pw", "name": "Eve"},
    )
    token = r.json()["access_token"]
    resp = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Hack"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_item_not_found(client, auth_headers, wishlist):
    resp = await client.patch(
        f"/wishlists/{wishlist['id']}/items/nonexistent",
        json={"title": "x"},
        headers=auth_headers,
    )
    assert resp.status_code == 404
