# -------------------------------------------------------------
# NestNav AI Price Forecast Service
# -------------------------------------------------------------
# This Flask app loads the generated price history data
# and uses Facebook Prophet to forecast monthly average prices
# for the next 12 months based on past trends.
# -------------------------------------------------------------

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from prophet import Prophet
import os
from datetime import datetime
import logging

# -------------------------------------------------------------
# Flask setup
# -------------------------------------------------------------
app = Flask(__name__)
CORS(app)  # allow requests from Node.js at localhost:3000

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

# Path to your dataset (absolute, relative to project root)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(BASE_DIR, "public", "data", "price_history.csv")
META_PATH = os.path.join(BASE_DIR, "public", "data", "updated_dataset.csv")
PLOTS_HISTORY = os.path.join(BASE_DIR, "public", "data", "plots_history.csv")
RENTALS_HISTORY = os.path.join(BASE_DIR, "public", "data", "rentals_history.csv")

# -------------------------------------------------------------
# Utility: load and validate dataset
# -------------------------------------------------------------
def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Price history file not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    if not {'Area', 'Date', 'AveragePrice'}.issubset(df.columns):
        raise ValueError("Dataset must have columns: Area, Date, AveragePrice")

    df['Date'] = pd.to_datetime(df['Date'])
    return df

def load_meta():
    if not os.path.exists(META_PATH):
        raise FileNotFoundError(f"Dataset not found: {META_PATH}")
    meta = pd.read_csv(META_PATH)
    return meta

# -------------------------------------------------------------
# API endpoint: /forecast
# -------------------------------------------------------------
@app.route('/forecast', methods=['POST'])
def forecast():
    try:
        data = request.get_json(force=True)
        area = data.get("area")
        months = int(data.get("months", 12))
        months = max(1, min(months, 60))

        if not area:
            return jsonify({"error": "Missing 'area' field in request."}), 400

        df = load_data()

        # Filter for selected area
        area_df = df[df["Area"].str.lower() == area.lower()]
        if area_df.empty:
            return jsonify({"error": f"No data found for area: {area}"}), 404

        # Prepare Prophet input
        area_df = area_df.rename(columns={"Date": "ds", "AveragePrice": "y"})
        area_df = area_df.sort_values("ds")

        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False
        )
        model.fit(area_df)

        # Predict next N months
        future = model.make_future_dataframe(periods=months, freq="M")
        forecast = model.predict(future)

        # Keep only the future horizon rows (exclude history)
        last_history_date = area_df['ds'].max()
        # Ensure we start from current month if dataset is behind
        current_month_start = pd.Timestamp(datetime.today().replace(day=1))
        start_cutoff = max(last_history_date, current_month_start)
        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]
        result = result[result['ds'] > start_cutoff].head(months)
        result["ds"] = result["ds"].dt.strftime("%Y-%m")

        response = result.to_dict(orient="records")

        logging.info(f"✅ Forecast generated successfully for: {area}")
        return jsonify(response)

    except Exception as e:
        logging.error(f"❌ Error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------
# API endpoint: /forecast_plots (synthetic seasonal trend)
# -------------------------------------------------------------
@app.route('/forecast_plots', methods=['POST'])
def forecast_plots():
    try:
        data = request.get_json(force=True)
        area = data.get("area")
        months = int(data.get("months", 12))
        months = max(1, min(months, 60))

        if not area:
            return jsonify({"error": "Missing 'area' field in request."}), 400

        # Prefer historical plots dataset if available
        if os.path.exists(PLOTS_HISTORY):
            df = pd.read_csv(PLOTS_HISTORY)
            df = df[df['Area'].str.lower() == area.lower()].copy()
            if df.empty:
                # fall back to meta-based synthetic
                raise FileNotFoundError('Area not found in plots history')
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.rename(columns={'Date': 'ds', 'AvailablePlots': 'y'})
            df = df.sort_values('ds')
            model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            model.fit(df)
            future = model.make_future_dataframe(periods=months, freq='M')
            fc = model.predict(future)
            cutoff = max(df['ds'].max(), pd.Timestamp(datetime.today().replace(day=1)))
            res = fc[['ds', 'yhat']]
            res = res[res['ds'] > cutoff].head(months)
            res['ds'] = res['ds'].dt.strftime('%Y-%m')
            result = res.to_dict(orient='records')
        else:
            # Meta-based synthetic
            meta = load_meta()
            row = meta[meta['Location'].str.lower() == area.lower()]
            if row.empty:
                return jsonify({"error": f"No metadata found for area: {area}"}), 404
            base = int(row.iloc[0].get('AvailablePlots', 0) or 0)
            index = pd.date_range(datetime.today().replace(day=1), periods=months, freq='MS')
            values = []
            current = max(base, 0)
            for i in range(months):
                seasonal = 1.0 + 0.08 * (0.5 - ((i % 6) / 5.0))
                drift = -0.01 * i
                est = max(0, int(current * seasonal + drift * current))
                values.append(est)
                current = max(0, int(0.95 * current + 0.05 * est))
            result = [{ 'ds': dt.strftime('%Y-%m'), 'yhat': val } for dt, val in zip(index, values)]

        return jsonify(result)
    except Exception as e:
        logging.error(f"❌ Plots forecast error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------
# API endpoint: /forecast_rentals (heuristic estimate)
# -------------------------------------------------------------
@app.route('/forecast_rentals', methods=['POST'])
def forecast_rentals():
    try:
        data = request.get_json(force=True)
        area = data.get("area")
        months = int(data.get("months", 12))
        months = max(1, min(months, 60))

        if not area:
            return jsonify({"error": "Missing 'area' field in request."}), 400

        if os.path.exists(RENTALS_HISTORY):
            df = pd.read_csv(RENTALS_HISTORY)
            df = df[df['Area'].str.lower() == area.lower()].copy()
            if df.empty:
                raise FileNotFoundError('Area not found in rentals history')
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.rename(columns={'Date': 'ds', 'RentalsAvailable': 'y'})
            df = df.sort_values('ds')
            model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            model.fit(df)
            future = model.make_future_dataframe(periods=months, freq='M')
            fc = model.predict(future)
            cutoff = max(df['ds'].max(), pd.Timestamp(datetime.today().replace(day=1)))
            res = fc[['ds', 'yhat']]
            res = res[res['ds'] > cutoff].head(months)
            res['ds'] = res['ds'].dt.strftime('%Y-%m')
            result = res.to_dict(orient='records')
        else:
            meta = load_meta()
            row = meta[meta['Location'].str.lower() == area.lower()]
            if row.empty:
                return jsonify({"error": f"No metadata found for area: {area}"}), 404
            cost = float(row.iloc[0].get('CostScore', 5) or 5)
            services = float(row.iloc[0].get('ServicesScore', 5) or 5)
            connectivity = float(row.iloc[0].get('ConnectivityScore', 5) or 5)
            base = int(100 + (10 - cost) * 40 + services * 20 + connectivity * 15)
            index = pd.date_range(datetime.today().replace(day=1), periods=months, freq='MS')
            values = []
            for i in range(months):
                seasonal = 1.0 + 0.05 * (0.5 - ((i % 12) / 11.0))
                growth = 1.0 + 0.01 * i
                est = max(0, int(base * seasonal * growth))
                values.append(est)
            result = [{ 'ds': dt.strftime('%Y-%m'), 'yhat': val } for dt, val in zip(index, values)]

        return jsonify(result)
    except Exception as e:
        logging.error(f"❌ Rentals forecast error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
# -------------------------------------------------------------
# Run Flask app
# -------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
