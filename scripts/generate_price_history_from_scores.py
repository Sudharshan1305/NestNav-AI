import pandas as pd
import csv
import random
from datetime import datetime
from dateutil.relativedelta import relativedelta
import os

# ✅ Load your renamed dataset
base_df = pd.read_csv('public/data/updated_dataset.csv')

start_date = datetime(2020, 1, 1)
# Generate up to current month (inclusive) so Prophet can forecast beyond 2025
today = datetime.today().replace(day=1)
delta_years = (today.year - start_date.year) * 12 + (today.month - start_date.month)
months = max(48, delta_years + 1)

output_path = 'public/data/price_history.csv'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Area', 'Date', 'AveragePrice'])

    for _, row in base_df.iterrows():
        area = row['Location']
        # Base price influenced by CostScore (inverse: lower cost → higher price)
        cost_score = float(row['CostScore']) if 'CostScore' in row and pd.notna(row['CostScore']) else 6.0
        base_price = 1000000 * (12 - cost_score) + random.randint(0, 200000)
        for m in range(months):
            date = (start_date + relativedelta(months=m)).strftime("%Y-%m")
            growth = 1 + 0.04 * (m / 12)   # ~4% yearly trend
            seasonal = 1 + 0.06 * (random.random() - 0.5)  # mild seasonality/noise
            price = int(base_price * growth * seasonal)
            writer.writerow([area, date, price])

print(f"Generated synthetic price history for {len(base_df)} areas in {output_path}")
