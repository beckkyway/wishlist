import pytest


@pytest.mark.asyncio
async def test_reserve_item(client, wishlist, item):
    resp = await client.post(
        f"/items/{item['id']}/reserve",
        json={"reserver_name": "Alice"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "reservation_id" in data
    assert "reserver_token" in data


@pytest.mark.asyncio
async def test_reserve_item_twice(client, wishlist, item):
    await client.post(f"/items/{item['id']}/reserve", json={"reserver_name": "Alice"})
    resp = await client.post(f"/items/{item['id']}/reserve", json={"reserver_name": "Bob"})
    assert resp.status_code == 409
    assert "already reserved" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_cancel_reservation(client, wishlist, item):
    r = await client.post(f"/items/{item['id']}/reserve", json={"reserver_name": "Alice"})
    token = r.json()["reserver_token"]

    resp = await client.request("DELETE", f"/items/{item['id']}/reserve", json={"reserver_token": token})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_cancel_reservation_wrong_token(client, wishlist, item):
    await client.post(f"/items/{item['id']}/reserve", json={"reserver_name": "Alice"})
    resp = await client.request("DELETE", f"/items/{item['id']}/reserve", json={"reserver_token": "wrong-token"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_reserve_deleted_item(client, auth_headers, wishlist):
    r = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Ephemeral"},
        headers=auth_headers,
    )
    item_id = r.json()["id"]
    await client.delete(f"/wishlists/{wishlist['id']}/items/{item_id}", headers=auth_headers)

    resp = await client.post(f"/items/{item_id}/reserve", json={"reserver_name": "Alice"})
    assert resp.status_code == 409
    assert "removed" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_reserve_nonexistent_item(client):
    resp = await client.post("/items/nonexistent/reserve", json={"reserver_name": "Alice"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_reserve_with_custom_token(client, wishlist, item):
    custom_token = "my-custom-token-abc123"
    r = await client.post(
        f"/items/{item['id']}/reserve",
        json={"reserver_name": "Bob", "reserver_token": custom_token},
    )
    assert r.status_code == 201
    assert r.json()["reserver_token"] == custom_token
