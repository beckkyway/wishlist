import pytest
import pytest_asyncio


async def _make_group_item(client, auth_headers, wishlist, target=500.0):
    r = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Group Gift", "is_group_gift": True, "target_amount": target},
        headers=auth_headers,
    )
    return r.json()


@pytest_asyncio.fixture
async def group_item(client, auth_headers, wishlist):
    return await _make_group_item(client, auth_headers, wishlist)


@pytest.mark.asyncio
async def test_add_contribution(client, group_item):
    resp = await client.post(
        f"/items/{group_item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 100.0},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount"] == 100.0
    assert "contributor_token" in data


@pytest.mark.asyncio
async def test_contribution_summary(client, group_item):
    await client.post(
        f"/items/{group_item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 150.0},
    )
    await client.post(
        f"/items/{group_item['id']}/contributions",
        json={"contributor_name": "Bob", "amount": 50.0},
    )
    resp = await client.get(f"/items/{group_item['id']}/contributions/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_collected"] >= 200.0
    assert data["count"] >= 2


@pytest.mark.asyncio
async def test_contribution_reaches_goal(client, auth_headers, wishlist):
    item = await _make_group_item(client, auth_headers, wishlist, target=100.0)
    resp = await client.post(
        f"/items/{item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 100.0},
    )
    assert resp.status_code == 201

    # Check item status changed to "collected"
    summary_resp = await client.get(f"/items/{item['id']}/contributions/summary")
    assert summary_resp.json()["total_collected"] >= 100.0


@pytest.mark.asyncio
async def test_delete_contribution(client, group_item):
    r = await client.post(
        f"/items/{group_item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 75.0},
    )
    token = r.json()["contributor_token"]
    contrib_id = r.json()["id"]

    resp = await client.request("DELETE", f"/contributions/{contrib_id}", json={"contributor_token": token})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_contribution_wrong_token(client, group_item):
    r = await client.post(
        f"/items/{group_item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 75.0},
    )
    contrib_id = r.json()["id"]

    resp = await client.request("DELETE", f"/contributions/{contrib_id}", json={"contributor_token": "wrong-token"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_contribution_to_collected_item_rejected(client, auth_headers, wishlist):
    item = await _make_group_item(client, auth_headers, wishlist, target=50.0)
    await client.post(
        f"/items/{item['id']}/contributions",
        json={"contributor_name": "Alice", "amount": 50.0},
    )
    # Goal reached — should reject further contributions
    resp = await client.post(
        f"/items/{item['id']}/contributions",
        json={"contributor_name": "Bob", "amount": 10.0},
    )
    assert resp.status_code == 409
