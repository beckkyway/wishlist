import pytest


@pytest.mark.asyncio
async def test_get_public_wishlist(client, wishlist):
    token = wishlist["share_token"]
    resp = await client.get(f"/share/{token}")
    assert resp.status_code == 200
    assert resp.json()["id"] == wishlist["id"]


@pytest.mark.asyncio
async def test_get_public_wishlist_invalid_token(client):
    resp = await client.get("/share/totally-invalid-token")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_public_wishlist_inactive(client, auth_headers, wishlist):
    # Deactivate wishlist
    await client.patch(
        f"/wishlists/{wishlist['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    resp = await client.get(f"/share/{wishlist['share_token']}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_public_items(client, wishlist, item):
    token = wishlist["share_token"]
    resp = await client.get(f"/share/{token}/items")
    assert resp.status_code == 200
    ids = [i["id"] for i in resp.json()]
    assert item["id"] in ids


@pytest.mark.asyncio
async def test_public_items_hides_deleted(client, auth_headers, wishlist, item):
    """Bug fix: deleted items must NOT appear on the public share page."""
    # Delete the item
    await client.delete(
        f"/wishlists/{wishlist['id']}/items/{item['id']}", headers=auth_headers
    )
    resp = await client.get(f"/share/{wishlist['share_token']}/items")
    assert resp.status_code == 200
    ids = [i["id"] for i in resp.json()]
    assert item["id"] not in ids


@pytest.mark.asyncio
async def test_public_items_reserver_token_works(client, auth_headers, wishlist):
    """Bug fix: reserver_token query param should NOT crash (was lazy-loading bug)."""
    # Create item
    r = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Reservable"},
        headers=auth_headers,
    )
    item_id = r.json()["id"]

    # Reserve it
    reserve_resp = await client.post(
        f"/items/{item_id}/reserve",
        json={"reserver_name": "Friend"},
    )
    reserver_token = reserve_resp.json()["reserver_token"]

    # Fetch public items WITH reserver_token — must not crash
    resp = await client.get(
        f"/share/{wishlist['share_token']}/items",
        params={"reserver_token": reserver_token},
    )
    assert resp.status_code == 200
    items = resp.json()
    reservable = next(i for i in items if i["id"] == item_id)
    assert reservable["is_reserved_by_me"] is True


@pytest.mark.asyncio
async def test_public_items_reserver_token_other_user(client, auth_headers, wishlist):
    """is_reserved_by_me=False for a token that didn't reserve this item."""
    r = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Another Item"},
        headers=auth_headers,
    )
    item_id = r.json()["id"]
    await client.post(f"/items/{item_id}/reserve", json={"reserver_name": "Friend"})

    resp = await client.get(
        f"/share/{wishlist['share_token']}/items",
        params={"reserver_token": "wrong-token"},
    )
    assert resp.status_code == 200
    items = resp.json()
    target = next((i for i in items if i["id"] == item_id), None)
    if target:
        assert target["is_reserved_by_me"] is False


@pytest.mark.asyncio
async def test_get_item_contributions_public(client, auth_headers, wishlist):
    r = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Fund Me", "is_group_gift": True, "target_amount": 1000.0},
        headers=auth_headers,
    )
    item_id = r.json()["id"]

    await client.post(
        f"/items/{item_id}/contributions",
        json={"contributor_name": "Alice", "amount": 200.0, "note": "Happy birthday!"},
    )

    resp = await client.get(f"/share/{wishlist['share_token']}/items/{item_id}/contributions")
    assert resp.status_code == 200
    contribs = resp.json()
    assert len(contribs) >= 1
    assert contribs[0]["contributor_name"] == "Alice"
    assert contribs[0]["amount"] == 200.0
    assert contribs[0]["note"] == "Happy birthday!"
