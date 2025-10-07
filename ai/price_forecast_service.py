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

# Path to your dataset
DATA_PATH = os.path.join("public", "data", "price_history.csv")

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

# -------------------------------------------------------------
# API endpoint: /forecast
# -------------------------------------------------------------
@app.route('/forecast', methods=['POST'])
def forecast():
    try:
        data = request.get_json(force=True)
        area = data.get("area")

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

        # Predict next 12 months
        future = model.make_future_dataframe(periods=12, freq="M")
        forecast = model.predict(future)

        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(12)
        result["ds"] = result["ds"].dt.strftime("%Y-%m")

        response = result.to_dict(orient="records")

        logging.info(f"✅ Forecast generated successfully for: {area}")
        return jsonify(response)

    except Exception as e:
        logging.error(f"❌ Error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------
# Run Flask app
# -------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
