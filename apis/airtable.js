const axios = require("axios");

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

const airtable = axios.create({
	baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
	headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
});

const metaClient = axios.create({
	baseURL: `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}`,
	headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
});

const getExistingFields = async () => {
	try {
		const { data } = await metaClient.get(`/tables`);
		const table = data.tables.find((t) => t.id === AIRTABLE_TABLE_ID);
		return table?.fields || [];
	} catch (err) {
		throw new Error("getExistingFields -> " + err.message);
	}
};

const createField = async (name, config) => {
	try {
		const body = typeof config === "string"
			? { name, type: config }
			: { name, type: config.type, options: config.options };
		const { data } = await metaClient.post(`/tables/${AIRTABLE_TABLE_ID}/fields`, body);
		return data;
	} catch (err) {
		const detail = err.response?.data?.error?.message || err.message;
		throw new Error(`createField(${name}, ${JSON.stringify(config)}) -> ${detail}`);
	}
}

const syncFields = async (fieldSchema) => {
	try {
		const existingFields = await getExistingFields();
		const existingByName = new Map(existingFields.map((f) => [f.name, f.type]));

		const created = [];
		const mismatched = [];
		for (const [name, config] of Object.entries(fieldSchema)) {
			const expectedType = typeof config === "string" ? config : config.type;

			if (!existingByName.has(name)) {
				await createField(name, config);
				created.push(name);
			} else if (existingByName.get(name) !== expectedType) {
				mismatched.push(`${name} (expected: ${expectedType}, actual: ${existingByName.get(name)})`);
			}
		}

		if (created.length > 0) {
			console.log(`Created Airtable fields: ${created.join(", ")}`);
		}
		if (mismatched.length > 0) {
			console.warn(`Field type mismatches (update manually in Airtable): ${mismatched.join(", ")}`);
		}
		if (created.length === 0 && mismatched.length === 0) {
			console.log("All Airtable fields already exist with correct types");
		}

		return
	} catch (err) {
		throw new Error("syncFields -> " + err.message);
	}
}

const findRecord = async (fieldName, fieldValue) => {
	try {
		const { data } = await airtable.get("/", {
			params: {
				filterByFormula: `{${fieldName}} = "${fieldValue}"`,
				maxRecords: 1,
			},
		});
		return data.records?.[0] || null;
	} catch (err) {
		throw new Error("findRecord -> " + err.message);
	}
}

const createRecord = async (fields) => {
	try {
		const { data } = await airtable.post("/", { fields });
		return data;
	} catch (err) {
		throw new Error("createRecord -> " + err.message);
	}
}

const updateRecord = async (recordId, fields) => {
	try {
		const { data } = await airtable.patch(`/${recordId}`, { fields });
		return data;
	} catch (err) {
		throw new Error("updateRecord -> " + err.message);
	}
}

module.exports = { syncFields, findRecord, createRecord, updateRecord };
