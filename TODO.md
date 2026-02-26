# TODO: Link Requirements between index.html and admin_dashboard.html

## Plan

### 1. Update app.py
- [ ] Modify Requirement model to include company, place, positions, job_type fields
- [ ] Update home route to pass requirements data to index.html
- [ ] Create API routes for job management (add, get, delete jobs)

### 2. Update index.html
- [ ] Replace static job card with dynamic data from server
- [ ] Add JavaScript to fetch requirements from API

### 3. Update admin_dashboard.html
- [ ] Update Add Job form to include all required fields (company, place, positions, job_type)
- [ ] Update Manage Jobs panel to fetch and display jobs from API
- [ ] Make the Active Jobs section on Dashboard dynamic

## Implementation Steps

1. First, update app.py with the enhanced model and routes
2. Update index.html to display dynamic requirements
3. Update admin_dashboard.html to manage jobs properly
