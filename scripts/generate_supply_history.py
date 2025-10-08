import pandas as pd
import csv
import random
from datetime import datetime
from dateutil.relativedelta import relativedelta
import os

BASE_META = 'public/data/updated_dataset.csv'
PLOTS_OUT = 'public/data/plots_history.csv'
RENTALS_OUT = 'public/data/rentals_history.csv'

def main():
    meta = pd.read_csv(BASE_META)

    start_date = datetime(2023, 1, 1)
    today = datetime.today().replace(day=1)
    months = (today.year - start_date.year) * 12 + (today.month - start_date.month) + 1

    os.makedirs('public/data', exist_ok=True)

    # Plots history
    with open(PLOTS_OUT, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Area', 'Date', 'AvailablePlots'])
        for _, row in meta.iterrows():
            area = str(row.get('Location', '')).strip()
            if not area:
                continue
            base_plots = int(row.get('AvailablePlots', 50) or 50)
            current = max(10, base_plots)
            for m in range(months):
                dt = (start_date + relativedelta(months=m)).strftime('%Y-%m')
                seasonal = 1.0 + 0.15 * (random.random() - 0.5)
                drift = -0.02 * (m / 12.0)  # slowly decrease
                val = max(0, int(current * seasonal * (1 + drift)))
                w.writerow([area, dt, val])
                current = max(5, int(0.9 * current + 0.1 * val))

    # Rentals history
    with open(RENTALS_OUT, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Area', 'Date', 'RentalsAvailable'])
        for _, row in meta.iterrows():
            area = str(row.get('Location', '')).strip()
            if not area:
                continue
            cost = float(row.get('CostScore', 5) or 5)
            services = float(row.get('ServicesScore', 5) or 5)
            connectivity = float(row.get('ConnectivityScore', 5) or 5)
            base = int(80 + (10 - cost) * 25 + services * 10 + connectivity * 8)
            for m in range(months):
                dt = (start_date + relativedelta(months=m)).strftime('%Y-%m')
                seasonal = 1.0 + 0.1 * (random.random() - 0.5)
                growth = 1.0 + 0.03 * (m / 12.0)
                val = max(0, int(base * seasonal * growth))
                w.writerow([area, dt, val])

    print(f'Generated {PLOTS_OUT} and {RENTALS_OUT} with {months} months of data.')

if __name__ == '__main__':
    main()


