require("dotenv").config();
const express = require("express");
const { syncFields, findRecord, createRecord, updateRecord } = require("./apis/airtable");
const fieldSchema = require("./fieldSchema");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Phantombuster webhook endpoint
app.get("/", (req, res) => {
	res.json({ success: true, message: "Server is running" });
});

app.post("/", async (req, res) => {
	res.json({ success: true });
	try {
		// Ensure all Airtable fields exist before processing
		await syncFields(fieldSchema);

		// Parse the results array from Phantombuster's resultObject string
		const results = JSON.parse(req.body.resultObject);
		console.log("Processing", results.length, "records");
		const outcomes = [];

		for (const record of results) {
			console.log("Processing record:", record.placeUrl);
			// Only include fields defined in the schema
			const fields = {};
			for (const key of Object.keys(fieldSchema)) {
				if (record[key] !== undefined) {
					fields[key] = record[key];
				}
			}

			// Cast types where Phantombuster sends strings
			if (fields.rating) fields.rating = parseFloat(fields.rating);

			try {
				// Check if record already exists by Google Maps URL
				const existing = await findRecord("placeUrl", record.placeUrl);

				if (existing) {
					console.log("Updating record:", record.placeUrl);
					const updated = await updateRecord(existing.id, fields);
					outcomes.push({ placeUrl: record.placeUrl, action: "updated", id: updated.id });
				} else {
					console.log("Creating record:", record.placeUrl);
					const created = await createRecord(fields);
					outcomes.push({ placeUrl: record.placeUrl, action: "created", id: created.id });
				}
			} catch (err) {
				throw new Error("Error processing record: " + record.placeUrl + " - " + err.message);
			}
		}

		const created = outcomes.filter((o) => o.action === "created").length;
		const updated = outcomes.filter((o) => o.action === "updated").length;
		console.log(`Processing completed: ${created} created, ${updated} updated`);
		return
	} catch (err) {
		console.error("Error processing webhook:", err);
		res.status(500).json({ success: false, error: err.message });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
