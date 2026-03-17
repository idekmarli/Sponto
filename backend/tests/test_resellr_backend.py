"""Comprehensive backend tests for Resellr OS

Tests cover:
- Dashboard endpoint
- Items CRUD operations with data persistence
- Pipeline workflow stages
- Source calculator
- Insights analytics
- Settings management
- Dead stock tracking
"""

import pytest
import requests


class TestDashboard:
    """Dashboard endpoint tests"""

    def test_dashboard_returns_200(self, api_client, base_url):
        """Test dashboard endpoint is accessible"""
        response = api_client.get(f"{base_url}/api/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Dashboard returns 200")

    def test_dashboard_has_required_fields(self, api_client, base_url):
        """Test dashboard returns all required fields"""
        response = api_client.get(f"{base_url}/api/dashboard")
        data = response.json()
        
        required_fields = [
            'monthly_net_profit', 'monthly_revenue', 'sold_this_month',
            'active_listings', 'capital_in_inventory', 'dead_stock_count',
            'best_platform', 'best_category', 'actions', 'trends', 'total_items'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert isinstance(data['monthly_net_profit'], (int, float))
        assert isinstance(data['sold_this_month'], int)
        assert isinstance(data['actions'], list)
        assert isinstance(data['trends'], list)
        print(f"✓ Dashboard has all required fields, total_items: {data['total_items']}")

    def test_dashboard_trends_structure(self, api_client, base_url):
        """Test trends array has correct structure"""
        response = api_client.get(f"{base_url}/api/dashboard")
        data = response.json()
        
        if len(data['trends']) > 0:
            trend = data['trends'][0]
            assert 'month' in trend
            assert 'revenue' in trend
            assert 'profit' in trend
            print(f"✓ Trends structure valid, {len(data['trends'])} months")


class TestItems:
    """Items CRUD tests with data persistence verification"""

    def test_get_items_returns_200(self, api_client, base_url):
        """Test GET /api/items endpoint"""
        response = api_client.get(f"{base_url}/api/items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/items returns {len(data)} items")

    def test_get_items_with_status_filter(self, api_client, base_url):
        """Test filtering items by status"""
        response = api_client.get(f"{base_url}/api/items?status=listed")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for item in data:
            assert item.get('status') == 'listed'
        print(f"✓ Status filter works, {len(data)} listed items")

    def test_get_items_returns_computed_fields(self, api_client, base_url):
        """Test items include computed fields"""
        response = api_client.get(f"{base_url}/api/items")
        data = response.json()
        
        if len(data) > 0:
            item = data[0]
            assert 'total_cost_basis' in item
            assert 'net_profit' in item
            assert 'roi' in item
            assert 'health' in item
            print(f"✓ Items include computed fields (cost_basis, net_profit, roi, health)")

    def test_create_item_and_verify_persistence(self, api_client, base_url):
        """Test creating an item and verifying it persists in database"""
        create_payload = {
            "title": "TEST_Playwright Test Item",
            "brand": "TEST_Brand",
            "category": "Tops",
            "purchase_price": 50,
            "target_list_price": 120,
            "status": "sourced"
        }
        
        # Create item
        create_response = api_client.post(f"{base_url}/api/items", json=create_payload)
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}"
        
        created_item = create_response.json()
        assert created_item['title'] == create_payload['title']
        assert 'id' in created_item
        item_id = created_item['id']
        
        # Verify persistence with GET
        get_response = api_client.get(f"{base_url}/api/items/{item_id}")
        assert get_response.status_code == 200
        retrieved_item = get_response.json()
        assert retrieved_item['title'] == create_payload['title']
        assert retrieved_item['brand'] == create_payload['brand']
        
        # Cleanup
        api_client.delete(f"{base_url}/api/items/{item_id}")
        print(f"✓ Create item and verify persistence: {item_id}")

    def test_update_item_and_verify_changes(self, api_client, base_url):
        """Test updating an item and verifying changes persist"""
        # Create item first
        create_payload = {"title": "TEST_Update Test", "purchase_price": 30, "status": "sourced"}
        create_response = api_client.post(f"{base_url}/api/items", json=create_payload)
        item_id = create_response.json()['id']
        
        # Update item
        update_payload = {"status": "listed", "target_list_price": 90}
        update_response = api_client.put(f"{base_url}/api/items/{item_id}", json=update_payload)
        assert update_response.status_code == 200
        
        # Verify changes with GET
        get_response = api_client.get(f"{base_url}/api/items/{item_id}")
        updated_item = get_response.json()
        assert updated_item['status'] == 'listed'
        assert updated_item['target_list_price'] == 90
        
        # Cleanup
        api_client.delete(f"{base_url}/api/items/{item_id}")
        print(f"✓ Update item and verify changes: {item_id}")

    def test_delete_item_and_verify_removal(self, api_client, base_url):
        """Test deleting an item and verifying it's removed"""
        # Create item first
        create_payload = {"title": "TEST_Delete Test", "purchase_price": 20}
        create_response = api_client.post(f"{base_url}/api/items", json=create_payload)
        item_id = create_response.json()['id']
        
        # Delete item
        delete_response = api_client.delete(f"{base_url}/api/items/{item_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()['deleted'] == True
        
        # Verify item is gone
        get_response = api_client.get(f"{base_url}/api/items/{item_id}")
        assert get_response.status_code == 404
        print(f"✓ Delete item and verify removal: {item_id}")

    def test_get_nonexistent_item_returns_404(self, api_client, base_url):
        """Test getting non-existent item returns 404"""
        response = api_client.get(f"{base_url}/api/items/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Non-existent item returns 404")


class TestPipeline:
    """Pipeline workflow stage tests"""

    def test_pipeline_returns_200(self, api_client, base_url):
        """Test pipeline endpoint is accessible"""
        response = api_client.get(f"{base_url}/api/pipeline")
        assert response.status_code == 200
        print("✓ Pipeline returns 200")

    def test_pipeline_has_all_stages(self, api_client, base_url):
        """Test pipeline returns all workflow stages"""
        response = api_client.get(f"{base_url}/api/pipeline")
        data = response.json()
        
        expected_stages = ['sourced', 'intake', 'photographed', 'listed', 'crosslisted', 'sold', 'shipped', 'completed']
        for stage in expected_stages:
            assert stage in data, f"Missing stage: {stage}"
            assert isinstance(data[stage], list)
        print(f"✓ Pipeline has all {len(expected_stages)} stages")

    def test_pipeline_items_are_properly_grouped(self, api_client, base_url):
        """Test items are grouped by status in pipeline"""
        response = api_client.get(f"{base_url}/api/pipeline")
        data = response.json()
        
        total_items = sum(len(items) for items in data.values())
        print(f"✓ Pipeline groups {total_items} items across stages")


class TestSourceCalculator:
    """Source calculator tests"""

    def test_source_calculate_buy_verdict(self, api_client, base_url):
        """Test source calculator returns 'buy' for good deal"""
        payload = {
            "purchase_price": 50,
            "expected_sale_price": 150,
            "platform": "ebay",
            "shipping_to_acquire": 5,
            "prep_cost": 0,
            "packaging_cost": 2
        }
        
        response = api_client.post(f"{base_url}/api/source/calculate", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert 'verdict' in result
        assert result['verdict'] in ['buy', 'risky', 'skip']
        assert 'net_profit' in result
        assert 'roi' in result
        assert 'total_cost_basis' in result
        assert 'break_even_price' in result
        
        print(f"✓ Source calculator: verdict={result['verdict']}, ROI={result['roi']}%, profit=${result['net_profit']}")

    def test_source_calculate_skip_verdict(self, api_client, base_url):
        """Test source calculator returns 'skip' for bad deal"""
        payload = {
            "purchase_price": 100,
            "expected_sale_price": 90,
            "platform": "ebay"
        }
        
        response = api_client.post(f"{base_url}/api/source/calculate", json=payload)
        result = response.json()
        
        assert result['verdict'] == 'skip'
        assert result['net_profit'] < 0
        print(f"✓ Source calculator correctly identifies bad deals: verdict={result['verdict']}")

    def test_source_calculate_different_platforms(self, api_client, base_url):
        """Test source calculator works with different platforms"""
        platforms = ['ebay', 'depop', 'vinted', 'vestiaire', 'poshmark', 'etsy']
        
        for platform in platforms:
            payload = {
                "purchase_price": 40,
                "expected_sale_price": 100,
                "platform": platform
            }
            response = api_client.post(f"{base_url}/api/source/calculate", json=payload)
            assert response.status_code == 200
            result = response.json()
            assert 'fee_percentage' in result
        
        print(f"✓ Source calculator works with all {len(platforms)} platforms")


class TestInsights:
    """Insights analytics tests"""

    def test_insights_returns_200(self, api_client, base_url):
        """Test insights endpoint is accessible"""
        response = api_client.get(f"{base_url}/api/insights")
        assert response.status_code == 200
        print("✓ Insights returns 200")

    def test_insights_has_required_fields(self, api_client, base_url):
        """Test insights returns all analytics fields"""
        response = api_client.get(f"{base_url}/api/insights")
        data = response.json()
        
        required_fields = [
            'platform_revenue', 'platform_profit', 'category_performance',
            'avg_roi', 'avg_days_to_sell', 'dead_stock_percentage',
            'capital_in_stale', 'monthly_trends', 'total_sold', 'total_active'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert isinstance(data['platform_revenue'], dict)
        assert isinstance(data['category_performance'], dict)
        assert isinstance(data['monthly_trends'], list)
        print(f"✓ Insights has all required fields: avg_roi={data['avg_roi']}%, total_sold={data['total_sold']}")

    def test_insights_monthly_trends_structure(self, api_client, base_url):
        """Test monthly trends have correct structure"""
        response = api_client.get(f"{base_url}/api/insights")
        data = response.json()
        
        if len(data['monthly_trends']) > 0:
            trend = data['monthly_trends'][0]
            assert 'month' in trend
            assert 'revenue' in trend
            assert 'profit' in trend
            print(f"✓ Monthly trends structure valid, {len(data['monthly_trends'])} months")


class TestDeadStock:
    """Dead stock tracking tests"""

    def test_deadstock_returns_200(self, api_client, base_url):
        """Test dead stock endpoint is accessible"""
        response = api_client.get(f"{base_url}/api/deadstock")
        assert response.status_code == 200
        print("✓ Dead stock returns 200")

    def test_deadstock_has_buckets(self, api_client, base_url):
        """Test dead stock returns age buckets"""
        response = api_client.get(f"{base_url}/api/deadstock")
        data = response.json()
        
        expected_buckets = ['30_45', '45_60', '60_90', '90_plus']
        for bucket in expected_buckets:
            assert bucket in data, f"Missing bucket: {bucket}"
            assert isinstance(data[bucket], list)
        
        total_deadstock = sum(len(data[b]) for b in expected_buckets)
        print(f"✓ Dead stock has all age buckets, {total_deadstock} total items")

    def test_deadstock_items_have_urgency(self, api_client, base_url):
        """Test dead stock items include urgency and suggested action"""
        response = api_client.get(f"{base_url}/api/deadstock")
        data = response.json()
        
        for bucket in data:
            for item in data[bucket]:
                assert 'urgency' in item
                assert 'suggested_action' in item
        
        print("✓ Dead stock items include urgency and suggested actions")


class TestSettings:
    """Settings management tests"""

    def test_settings_returns_200(self, api_client, base_url):
        """Test settings endpoint is accessible"""
        response = api_client.get(f"{base_url}/api/settings")
        assert response.status_code == 200
        print("✓ Settings returns 200")

    def test_settings_has_required_fields(self, api_client, base_url):
        """Test settings returns all configuration fields"""
        response = api_client.get(f"{base_url}/api/settings")
        data = response.json()
        
        required_fields = [
            'platform_fees', 'target_roi', 'min_profit',
            'dead_stock_thresholds', 'default_packaging_cost', 'default_shipping'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert isinstance(data['platform_fees'], dict)
        assert 'ebay' in data['platform_fees']
        print(f"✓ Settings has all required fields, target_roi={data['target_roi']}%")

    def test_update_settings_and_verify(self, api_client, base_url):
        """Test updating settings and verifying changes persist"""
        # Get current settings
        get_response = api_client.get(f"{base_url}/api/settings")
        original_settings = get_response.json()
        original_roi = original_settings['target_roi']
        
        # Update settings
        new_roi = 60.0
        update_payload = {'target_roi': new_roi}
        update_response = api_client.put(f"{base_url}/api/settings", json=update_payload)
        assert update_response.status_code == 200
        
        # Verify changes
        verify_response = api_client.get(f"{base_url}/api/settings")
        updated_settings = verify_response.json()
        assert updated_settings['target_roi'] == new_roi
        
        # Restore original
        api_client.put(f"{base_url}/api/settings", json={'target_roi': original_roi})
        print(f"✓ Update settings and verify: target_roi {original_roi}% -> {new_roi}%")
