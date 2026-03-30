import re

with open('plan.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace container
html = html.replace('padding-top: 100px;', 'padding-top: 80px;')

# Replace card class
html = html.replace('<div class="col-md-8 col-lg-6 w-100 glass-card">', '<div class="glass-container w-100">')

# Replace form
old_form = '''            <form id="planForm">
                <div class="mb-3">
                    <label class="text-light mb-2 fw-semibold">Select Destination</label>
                    <input type="text" id="destinationInput" class="form-control bg-dark text-white border-secondary" list="destinationList" placeholder="Enter any city (e.g. Paris, Goa...)" required>
                    <datalist id="destinationList">
                        <option value="Loading suggestions...">
                    </datalist>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="text-light mb-2 fw-semibold">Duration (Days)</label>
                        <input type="number" id="days" class="form-control bg-dark text-white border-secondary" min="1" value="7" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="text-light mb-2 fw-semibold">Budget ($)</label>
                        <input type="number" id="budget" class="form-control bg-dark text-white border-secondary" min="100" value="2000" required>
                    </div>
                </div>
                <button type="submit" class="btn-explore w-100 justify-content-center py-3 fs-5" id="submitBtn">Generate Itinerary</button>
            </form>'''

new_form = '''            <form id="planForm">
                <input type="text" id="destinationInput" list="destinationList" placeholder="Where do you want to go?" required />
                <datalist id="destinationList">
                    <option value="Loading suggestions...">
                </datalist>

                <div class="row">
                    <div class="col-md-6">
                        <input id="daysInput" type="number" min="1" placeholder="Days" required />
                    </div>
                    <div class="col-md-6">
                        <input id="budgetInput" type="number" min="100" placeholder="Budget ($)" required />
                    </div>
                </div>

                <div id="validationMsg" class="text-danger mb-3 d-none text-center" style="font-size: 0.95rem; font-weight: 500; background: rgba(255,0,0,0.1); padding: 10px; border-radius: 8px;"></div>

                <button type="submit" id="submitBtn">Generate Itinerary</button>
            </form>'''

html = html.replace(old_form, new_form)
html = html.replace('<h2 class="fw-bold mb-4 text-white text-center">Design Your Experience</h2>', '<h2>Design Your Experience</h2>')

with open('plan.html', 'w', encoding='utf-8') as f:
    f.write(html)
