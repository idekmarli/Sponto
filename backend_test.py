#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Resellr OS
Tests all endpoints specified in the review request with proper validation.
"""

import requests
import json
from typing import Dict, Any, List
import os
import sys

def get_backend_url():
    """Get backend URL from frontend .env file"""
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return "https://resellr-os.preview.emergentagent.com"

BASE_URL = get_backend_url()

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.passed = 0
        self.failed = 0
        self.failures = []

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test results"""
        if success:
            print(f"✅ {test_name}: {message}")
            self.passed += 1
        else:
            print(f"❌ {test_name}: {message}")
            self.failed += 1
            self.failures.append(f"{test_name}: {message}")

    def test_dashboard_api(self):
        """Test Dashboard API - GET /api/dashboard"""
        print("\n=== Testing Dashboard API ===")
        
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard")
            
            # Test 1: Status code
            if response.status_code == 200:
                self.log_result("Dashboard Status", True, "Returns 200 OK")
            else:
                self.log_result("Dashboard Status", False, f"Got {response.status_code}, expected 200")
                return
            
            data = response.json()
            
            # Test 2: Required fields presence
            required_fields = [
                'monthly_net_profit', 'monthly_revenue', 'capital_in_inventory', 
                'active_listings', 'pre_listing', 'dead_stock_count', 'stale_count', 
                'sell_through_rate', 'actions'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_result("Dashboard Required Fields", True, f"All {len(required_fields)} fields present")
            else:
                self.log_result("Dashboard Required Fields", False, f"Missing: {missing_fields}")
            
            # Test 3: Actions array structure
            if 'actions' in data and isinstance(data['actions'], list):
                if len(data['actions']) > 0:
                    action = data['actions'][0]
                    action_fields = ['priority', 'type', 'item_id', 'title', 'message']
                    action_ok = all(field in action for field in action_fields)
                    if action_ok:
                        self.log_result("Dashboard Actions Structure", True, f"{len(data['actions'])} actions with correct fields")
                    else:
                        missing = [f for f in action_fields if f not in action]
                        self.log_result("Dashboard Actions Structure", False, f"Action missing: {missing}")
                else:
                    self.log_result("Dashboard Actions Structure", True, "Actions array present but empty")
            else:
                self.log_result("Dashboard Actions Structure", False, "Actions is not a list")
            
            # Test 4: Data types validation
            numeric_fields = ['monthly_net_profit', 'monthly_revenue', 'capital_in_inventory']
            type_errors = []
            for field in numeric_fields:
                if field in data and not isinstance(data[field], (int, float)):
                    type_errors.append(field)
            
            if not type_errors:
                self.log_result("Dashboard Data Types", True, "Numeric fields have correct types")
            else:
                self.log_result("Dashboard Data Types", False, f"Wrong types for: {type_errors}")
                
        except Exception as e:
            self.log_result("Dashboard API", False, f"Exception: {str(e)}")

    def test_items_crud_api(self):
        """Test Items CRUD API"""
        print("\n=== Testing Items CRUD API ===")
        
        # Test 1: GET /api/items
        try:
            response = self.session.get(f"{self.base_url}/api/items")
            if response.status_code == 200:
                items = response.json()
                self.log_result("Items GET All", True, f"Returns {len(items)} items")
                
                # Check computed fields if items exist
                if len(items) > 0:
                    item = items[0]
                    computed_fields = ['total_cost_basis', 'net_profit', 'roi', 'health']
                    missing_computed = [f for f in computed_fields if f not in item]
                    if not missing_computed:
                        self.log_result("Items Computed Fields", True, "All computed fields present")
                    else:
                        self.log_result("Items Computed Fields", False, f"Missing: {missing_computed}")
            else:
                self.log_result("Items GET All", False, f"Status {response.status_code}")
                return
        except Exception as e:
            self.log_result("Items GET All", False, f"Exception: {str(e)}")
            return
        
        # Test 2: POST /api/items (Create)
        test_item = {
            "title": "TEST_API_Item_Resellr",
            "brand": "Test Brand",
            "category": "Bags",
            "size": "OS",
            "purchase_price": 50.0,
            "target_list_price": 120.0,
            "status": "sourced",
            "tags": ["test"]
        }
        
        created_item_id = None
        try:
            response = self.session.post(f"{self.base_url}/api/items", json=test_item)
            if response.status_code == 200:
                created_item = response.json()
                created_item_id = created_item.get('id')
                if created_item_id and created_item['title'] == test_item['title']:
                    self.log_result("Items CREATE", True, f"Created item with ID: {created_item_id[:8]}...")
                else:
                    self.log_result("Items CREATE", False, "Created but data inconsistent")
            else:
                self.log_result("Items CREATE", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Items CREATE", False, f"Exception: {str(e)}")
        
        # Test 3: GET /api/items/{id} (Read single)
        if created_item_id:
            try:
                response = self.session.get(f"{self.base_url}/api/items/{created_item_id}")
                if response.status_code == 200:
                    item = response.json()
                    if item['title'] == test_item['title']:
                        self.log_result("Items GET Single", True, "Retrieved correct item")
                    else:
                        self.log_result("Items GET Single", False, "Item data mismatch")
                else:
                    self.log_result("Items GET Single", False, f"Status {response.status_code}")
            except Exception as e:
                self.log_result("Items GET Single", False, f"Exception: {str(e)}")
        
        # Test 4: PUT /api/items/{id} (Update)
        if created_item_id:
            update_data = {"status": "listed", "target_list_price": 140.0}
            try:
                response = self.session.put(f"{self.base_url}/api/items/{created_item_id}", json=update_data)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item['status'] == 'listed' and updated_item['target_list_price'] == 140.0:
                        self.log_result("Items UPDATE", True, "Item updated successfully")
                    else:
                        self.log_result("Items UPDATE", False, "Update data not applied")
                else:
                    self.log_result("Items UPDATE", False, f"Status {response.status_code}")
            except Exception as e:
                self.log_result("Items UPDATE", False, f"Exception: {str(e)}")
        
        # Test 5: DELETE /api/items/{id}
        if created_item_id:
            try:
                response = self.session.delete(f"{self.base_url}/api/items/{created_item_id}")
                if response.status_code == 200:
                    result = response.json()
                    if result.get('deleted') == True:
                        self.log_result("Items DELETE", True, "Item deleted successfully")
                        
                        # Verify deletion
                        verify_response = self.session.get(f"{self.base_url}/api/items/{created_item_id}")
                        if verify_response.status_code == 404:
                            self.log_result("Items DELETE Verification", True, "Item properly removed")
                        else:
                            self.log_result("Items DELETE Verification", False, "Item still exists")
                    else:
                        self.log_result("Items DELETE", False, "Delete response incorrect")
                else:
                    self.log_result("Items DELETE", False, f"Status {response.status_code}")
            except Exception as e:
                self.log_result("Items DELETE", False, f"Exception: {str(e)}")
        
        # Test 6: Status filters
        try:
            response = self.session.get(f"{self.base_url}/api/items?status=listed")
            if response.status_code == 200:
                filtered_items = response.json()
                if all(item.get('status') == 'listed' for item in filtered_items):
                    self.log_result("Items Status Filter", True, f"Filter works, {len(filtered_items)} listed items")
                else:
                    self.log_result("Items Status Filter", False, "Filter not working properly")
            else:
                self.log_result("Items Status Filter", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Items Status Filter", False, f"Exception: {str(e)}")

    def test_pipeline_api(self):
        """Test Pipeline API - GET /api/pipeline"""
        print("\n=== Testing Pipeline API ===")
        
        try:
            response = self.session.get(f"{self.base_url}/api/pipeline")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Pipeline Status", True, "Returns 200 OK")
                
                # Test stages structure (API returns objects with items array, not direct arrays)
                expected_stages = ['sourced', 'intake', 'photographed', 'listed', 'crosslisted', 'sold', 'shipped', 'completed']
                missing_stages = []
                for stage in expected_stages:
                    if stage not in data:
                        missing_stages.append(stage)
                    elif not isinstance(data[stage], dict) or 'items' not in data[stage]:
                        missing_stages.append(f"{stage} (wrong structure)")
                
                if not missing_stages:
                    total_items = sum(len(data[stage]['items']) for stage in expected_stages)
                    self.log_result("Pipeline Stages", True, f"All {len(expected_stages)} stages present, {total_items} total items")
                else:
                    self.log_result("Pipeline Stages", False, f"Issues with: {missing_stages}")
                
                # Test stage metadata
                stage_metadata_ok = True
                for stage in expected_stages:
                    if stage in data:
                        stage_data = data[stage]
                        required_meta = ['count', 'avg_days', 'stuck_count', 'is_bottleneck']
                        if not all(field in stage_data for field in required_meta):
                            stage_metadata_ok = False
                            break
                
                if stage_metadata_ok:
                    self.log_result("Pipeline Metadata", True, "All stages have required metadata")
                else:
                    self.log_result("Pipeline Metadata", False, "Some stages missing metadata")
            else:
                self.log_result("Pipeline Status", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Pipeline API", False, f"Exception: {str(e)}")

    def test_insights_api(self):
        """Test Insights API - GET /api/insights"""
        print("\n=== Testing Insights API ===")
        
        try:
            response = self.session.get(f"{self.base_url}/api/insights")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Insights Status", True, "Returns 200 OK")
                
                # Test required fields
                required_fields = [
                    'platform_revenue', 'platform_profit', 'category_performance', 
                    'avg_roi', 'avg_days_to_sell', 'dead_stock_percentage', 
                    'monthly_trends'
                ]
                
                missing_fields = []
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if not missing_fields:
                    self.log_result("Insights Fields", True, f"All {len(required_fields)} fields present")
                else:
                    self.log_result("Insights Fields", False, f"Missing: {missing_fields}")
                
                # Test data structure types
                type_checks = [
                    ('platform_revenue', dict),
                    ('platform_profit', dict), 
                    ('category_performance', dict),
                    ('monthly_trends', list),
                    ('avg_roi', (int, float)),
                    ('avg_days_to_sell', (int, float))
                ]
                
                type_errors = []
                for field, expected_type in type_checks:
                    if field in data and not isinstance(data[field], expected_type):
                        type_errors.append(field)
                
                if not type_errors:
                    self.log_result("Insights Data Types", True, "All field types correct")
                else:
                    self.log_result("Insights Data Types", False, f"Wrong types: {type_errors}")
                
                # Test trends structure
                if 'monthly_trends' in data and len(data['monthly_trends']) > 0:
                    trend = data['monthly_trends'][0]
                    trend_fields = ['month', 'revenue', 'profit']
                    if all(field in trend for field in trend_fields):
                        self.log_result("Insights Trends Structure", True, f"{len(data['monthly_trends'])} months of data")
                    else:
                        self.log_result("Insights Trends Structure", False, "Trend items missing fields")
                else:
                    self.log_result("Insights Trends Structure", True, "Trends array present (empty)")
            else:
                self.log_result("Insights Status", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Insights API", False, f"Exception: {str(e)}")

    def test_settings_api(self):
        """Test Settings API - GET/PUT /api/settings"""
        print("\n=== Testing Settings API ===")
        
        # Test GET settings
        original_settings = None
        try:
            response = self.session.get(f"{self.base_url}/api/settings")
            
            if response.status_code == 200:
                data = response.json()
                original_settings = data.copy()
                self.log_result("Settings GET", True, "Returns 200 OK")
                
                # Test required fields
                required_fields = ['platform_fees', 'target_roi', 'min_profit', 'min_margin']
                missing_fields = []
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if not missing_fields:
                    self.log_result("Settings Fields", True, f"All {len(required_fields)} fields present")
                else:
                    self.log_result("Settings Fields", False, f"Missing: {missing_fields}")
                
                # Test platform fees structure
                if 'platform_fees' in data and isinstance(data['platform_fees'], dict):
                    expected_platforms = ['ebay', 'depop', 'vinted', 'vestiaire', 'poshmark']
                    missing_platforms = [p for p in expected_platforms if p not in data['platform_fees']]
                    if not missing_platforms:
                        self.log_result("Settings Platform Fees", True, f"{len(data['platform_fees'])} platforms configured")
                    else:
                        self.log_result("Settings Platform Fees", False, f"Missing platforms: {missing_platforms}")
                else:
                    self.log_result("Settings Platform Fees", False, "platform_fees not a dict")
            else:
                self.log_result("Settings GET", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Settings GET", False, f"Exception: {str(e)}")
            return
        
        # Test PUT settings (update)
        if original_settings:
            original_roi = original_settings.get('target_roi', 50.0)
            test_roi = 75.0
            
            try:
                update_data = {'target_roi': test_roi}
                response = self.session.put(f"{self.base_url}/api/settings", json=update_data)
                
                if response.status_code == 200:
                    updated_settings = response.json()
                    if updated_settings.get('target_roi') == test_roi:
                        self.log_result("Settings PUT", True, f"Updated target_roi to {test_roi}%")
                        
                        # Restore original value
                        restore_data = {'target_roi': original_roi}
                        restore_response = self.session.put(f"{self.base_url}/api/settings", json=restore_data)
                        if restore_response.status_code == 200:
                            self.log_result("Settings Restore", True, f"Restored target_roi to {original_roi}%")
                        else:
                            self.log_result("Settings Restore", False, "Failed to restore original value")
                    else:
                        self.log_result("Settings PUT", False, "Update not applied correctly")
                else:
                    self.log_result("Settings PUT", False, f"Status {response.status_code}")
            except Exception as e:
                self.log_result("Settings PUT", False, f"Exception: {str(e)}")

    def test_source_calculator_api(self):
        """Test Source Calculator API - POST /api/source/calculate"""
        print("\n=== Testing Source Calculator API ===")
        
        # Test 1: Good deal (should return 'buy')
        good_deal = {
            "purchase_price": 40,
            "expected_sale_price": 120,
            "platform": "ebay",
            "shipping_to_acquire": 5,
            "prep_cost": 2,
            "packaging_cost": 3,
            "category": "Bags"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/source/calculate", json=good_deal)
            
            if response.status_code == 200:
                result = response.json()
                
                # Test required fields
                required_fields = [
                    'total_cost_basis', 'estimated_fees', 'net_profit', 'roi', 'margin',
                    'break_even_price', 'verdict', 'confidence'
                ]
                
                missing_fields = []
                for field in required_fields:
                    if field not in result:
                        missing_fields.append(field)
                
                if not missing_fields:
                    verdict = result['verdict']
                    roi = result['roi']
                    profit = result['net_profit']
                    self.log_result("Source Calculator Fields", True, f"All fields present - {verdict}, ROI: {roi}%, Profit: ${profit}")
                else:
                    self.log_result("Source Calculator Fields", False, f"Missing: {missing_fields}")
                
                # Test verdict values
                if result.get('verdict') in ['buy', 'risky', 'skip']:
                    self.log_result("Source Calculator Verdict", True, f"Valid verdict: {result['verdict']}")
                else:
                    self.log_result("Source Calculator Verdict", False, f"Invalid verdict: {result.get('verdict')}")
            else:
                self.log_result("Source Calculator Good Deal", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Source Calculator Good Deal", False, f"Exception: {str(e)}")
        
        # Test 2: Bad deal (should return 'skip')
        bad_deal = {
            "purchase_price": 100,
            "expected_sale_price": 80,
            "platform": "ebay"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/source/calculate", json=bad_deal)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('verdict') == 'skip' and result.get('net_profit', 0) <= 0:
                    self.log_result("Source Calculator Bad Deal", True, f"Correctly identifies bad deal: {result['verdict']}")
                else:
                    self.log_result("Source Calculator Bad Deal", False, f"Should be 'skip' but got {result.get('verdict')}")
            else:
                self.log_result("Source Calculator Bad Deal", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Source Calculator Bad Deal", False, f"Exception: {str(e)}")
        
        # Test 3: Different platforms
        platforms = ['ebay', 'depop', 'vinted', 'vestiaire', 'poshmark', 'etsy']
        platform_results = {}
        
        for platform in platforms:
            test_calc = {
                "purchase_price": 50,
                "expected_sale_price": 100,
                "platform": platform
            }
            
            try:
                response = self.session.post(f"{self.base_url}/api/source/calculate", json=test_calc)
                if response.status_code == 200:
                    result = response.json()
                    platform_results[platform] = result.get('fee_percentage', 0)
            except Exception as e:
                platform_results[platform] = f"Error: {e}"
        
        successful_platforms = [p for p, r in platform_results.items() if isinstance(r, (int, float))]
        if len(successful_platforms) == len(platforms):
            self.log_result("Source Calculator Platforms", True, f"All {len(platforms)} platforms working")
        else:
            failed = [p for p in platforms if p not in successful_platforms]
            self.log_result("Source Calculator Platforms", False, f"Failed platforms: {failed}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🧪 Starting Resellr OS Backend API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test suites
        self.test_dashboard_api()
        self.test_items_crud_api()
        self.test_pipeline_api()
        self.test_insights_api()
        self.test_settings_api()
        self.test_source_calculator_api()
        
        # Final summary
        total = self.passed + self.failed
        print("\n" + "=" * 60)
        print(f"📊 BACKEND API TEST RESULTS")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Success Rate: {(self.passed/total*100):.1f}%" if total > 0 else "N/A")
        
        if self.failures:
            print(f"\n💥 FAILURES ({len(self.failures)}):")
            for i, failure in enumerate(self.failures, 1):
                print(f"  {i}. {failure}")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)