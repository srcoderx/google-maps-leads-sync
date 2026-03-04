// Phantombuster field name -> Airtable field config
// Types that need options use { type, options } format
// See: https://airtable.com/developers/web/api/supported-field-types
module.exports = {
	placeUrl: "singleLineText",
	title: "singleLineText",
	rating: { type: "number", options: { precision: 1 } },
	reviewCount: { type: "number", options: { precision: 0 } },
	category: "singleLineText",
	attributes: "singleLineText",
	address: "singleLineText",
	plusCode: "singleLineText",
	website: "url",
	phoneNumber: "phoneNumber",
	currentStatus: "singleLineText",
	imgUrl: "url",
	isClaimed: { type: "checkbox", options: { color: "greenBright", icon: "check" } },
	monday: "singleLineText",
	tuesday: "singleLineText",
	wednesday: "singleLineText",
	thursday: "singleLineText",
	friday: "singleLineText",
	saturday: "singleLineText",
	sunday: "singleLineText",
	query: "url",
	timestamp: { type: "dateTime", options: { timeZone: "utc", dateFormat: { name: "iso" }, timeFormat: { name: "24hour" } } },
};
