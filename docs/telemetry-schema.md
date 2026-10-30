# ATLAS Telemetry Ingestion Schema (Developer Reference)

> **Notice:** This document is intended for firmware engineers, edge gateway developers, and backend maintainers. It is maintained outside of public and user-facing application routes.

---

## 1. Overview

The ATLAS platform accepts field telemetry from in-situ geotechnical sensors either via:
1. **Edge Pre-Shared Secret**: Using the `x-sensor-key` HTTP header.
2. **Authenticated Operator Session**: Using a standard `Bearer <JWT_TOKEN>` authorization header.

---

## 2. Ingestion Endpoints

### Single Reading Ingestion
- **Route:** `POST /api/readings/ingest`
- **Rate Limit:** 120 requests / minute per IP
- **Headers:**
  - `Content-Type: application/json`
  - `x-sensor-key: <SENSOR_INGESTION_KEY>` (or `Authorization: Bearer <JWT>`)

#### Request Payload Schema
```json
{
  "sensorId": "SEN-WY-MEP-01-RAIN",
  "value": 42.5,
  "unit": "mm/h",
  "observedAt": "2026-10-30T14:00:00.000Z",
  "dataSource": "field_edge_logger",
  "metadata": {
    "batteryVoltage": 12.6,
    "signalQuality": 92
  }
}
```

#### Field Specifications
| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `sensorId` | `string` | Yes | Registered hardware identifier matching a known Sensor document. | `"SEN-JM-RAV-02-TILT"` |
| `value` | `number` | Yes | Numerical physical measurement recorded by the instrument. | `1.45` |
| `unit` | `string` | Yes | Physical engineering unit. Must correspond to the sensor type. | `"mm/h"`, `"%"`, `"deg"`, `"kPa"` |
| `observedAt` | `ISO-8601 string` | Yes | UTC timestamp when the sample was recorded at the edge. | `"2026-10-30T14:00:00.000Z"` |
| `dataSource` | `string` | No | Identifier of the logging system (`field_edge_logger`, `manual`, etc.). | `"field_edge_logger"` |
| `metadata` | `object` | No | Arbitrary hardware telemetry (battery level, temperature, signal strength). | `{ "batteryVoltage": 12.4 }` |

---

### Batch Telemetry Ingestion
- **Route:** `POST /api/readings/batch`
- **Payload Schema:**
```json
{
  "readings": [
    {
      "sensorId": "SEN-WY-MEP-01-RAIN",
      "value": 28.0,
      "unit": "mm/h",
      "observedAt": "2026-10-30T14:00:00.000Z"
    },
    {
      "sensorId": "SEN-WY-MEP-01-SOIL",
      "value": 72.4,
      "unit": "%",
      "observedAt": "2026-10-30T14:00:00.000Z"
    }
  ]
}
```

---

## 3. Supported Physical Units and Range Limits

| Sensor Type | Physical Metric | Standard Unit | Warning Baseline | Critical Baseline |
| :--- | :--- | :--- | :--- | :--- |
| `rain_gauge` | Precipitation Intensity | `mm/h` | 25.0 mm/h | 50.0 mm/h |
| `soil_moisture` | Volumetric Saturation | `%` | 65.0 % | 80.0 % |
| `tiltmeter` | Bi-Axial Angular Shear | `deg` | 1.20 ° | 2.80 ° |
| `pore_pressure` | Hydrostatic Pore Water Pressure | `kPa` | 28.0 kPa | 45.0 kPa |

---

## 4. Response Codes

- `201 Created`: Telemetry successfully validated, recorded, and evaluated against the Landslide Hazard Index (LHI).
- `400 Bad Request`: Payload missing required fields or physical value out of realistic bounds.
- `401 Unauthorized`: Missing or invalid `x-sensor-key` / `Authorization` header.
- `429 Too Many Requests`: Rate limit threshold exceeded.
