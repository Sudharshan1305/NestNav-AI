import pandas as pd
import csv
import random
from datetime import datetime
from dateutil.relativedelta import relativedelta
import os

# ✅ Load your renamed dataset
base_df = pd.read_csv('public/data/updated_dataset.csv')

start_date = datetime(2020, 1, 1)
months = 48  # 4 years of monthly data

output_path = 'public/data/price_history.csv'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Area', 'Date', 'AveragePrice'])

    for _, row in base_df.iterrows():
        area = row['Location']
        # Base price influenced by CostScore (inverse: lower cost → higher price)
        base_price = 10_00_000 * (12 - row['CostScore']) + random.randint(0, 2_00_000)
        for m in range(months):
            date = (start_date + relativedelta(months=m)).strftime("%Y-%m")
            growth = 1 + 0.03 * (m / 12)   # ~3% yearly growth
            seasonal = 1 + 0.05 * (random.random() - 0.5)
            price = int(base_price * growth * seasonal)
            writer.writerow([area, date, price])

print(f"✅ Generated synthetic price history for {len(base_df)} areas in {output_path}")
