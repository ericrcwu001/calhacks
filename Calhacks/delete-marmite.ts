// Direct database deletion script for marmite
// This script uses fetch directly to avoid import.meta.env issues

const API_BASE_URL = "https://api-production.creao.ai";

interface ItemModel {
	id: string;
	name: string;
	upc: string;
	unit: string;
	image_url?: string | null;
}

interface IntakeModel {
	id: string;
	item_id: string;
	qty: number;
}

async function deleteMarmite() {
	try {
		console.log("🔍 Searching for marmite yeast extract...");

		// You'll need to get your auth token from the browser
		const authToken = process.env.AUTH_TOKEN;
		if (!authToken) {
			console.error("❌ AUTH_TOKEN environment variable not set");
			console.log("\nTo get your token:");
			console.log("1. Open the app in browser");
			console.log("2. Open browser DevTools (F12)");
			console.log("3. Go to Application > Local Storage");
			console.log("4. Copy the auth token value");
			console.log("5. Run: AUTH_TOKEN='your-token' npx tsx delete-marmite.ts");
			return;
		}

		const headers = {
			Authorization: `Bearer ${authToken}`,
			"Content-Type": "application/json",
		};

		// Get all items
		const itemsResponse = await fetch(
			`${API_BASE_URL}/data/store/v1/list/item`,
			{
				method: "POST",
				headers,
				body: JSON.stringify({ order: { field: "name", direction: "asc" } }),
			},
		);

		if (!itemsResponse.ok) {
			throw new Error(`Failed to fetch items: ${itemsResponse.status}`);
		}

		const itemsData = await itemsResponse.json();
		const allItems: ItemModel[] = itemsData.items || [];
		console.log(`📦 Total items in database: ${allItems.length}`);

		// Find marmite (case-insensitive)
		const marmiteItems = allItems.filter((item) =>
			item.name.toLowerCase().includes("marmite"),
		);

		if (marmiteItems.length === 0) {
			console.log("❌ No marmite items found in database");
			return;
		}

		console.log(`✅ Found ${marmiteItems.length} marmite item(s):`);
		marmiteItems.forEach((item) => {
			console.log(`  - ID: ${item.id}, Name: ${item.name}`);
		});

		// Delete each marmite item and its intakes
		for (const item of marmiteItems) {
			console.log(`\n🗑️  Deleting item: ${item.name} (${item.id})`);

			// First, get all associated intakes
			const intakesResponse = await fetch(
				`${API_BASE_URL}/data/store/v1/list/intake`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({
						filter: { item_id: item.id },
					}),
				},
			);

			if (intakesResponse.ok) {
				const intakesData = await intakesResponse.json();
				const intakes: IntakeModel[] = intakesData.items || [];
				console.log(`  Found ${intakes.length} intake record(s)`);

				// Delete each intake
				for (const intake of intakes) {
					const deleteIntakeResponse = await fetch(
						`${API_BASE_URL}/data/store/v1/delete/intake/${intake.id}`,
						{
							method: "POST",
							headers,
						},
					);

					if (deleteIntakeResponse.ok) {
						console.log(`    ✓ Deleted intake ${intake.id}`);
					} else {
						console.log(`    ✗ Failed to delete intake ${intake.id}`);
					}
				}
			}

			// Delete the item itself
			const deleteItemResponse = await fetch(
				`${API_BASE_URL}/data/store/v1/delete/item/${item.id}`,
				{
					method: "POST",
					headers,
				},
			);

			if (deleteItemResponse.ok) {
				console.log(`  ✓ Deleted item ${item.id}`);
			} else {
				console.log(`  ✗ Failed to delete item ${item.id}`);
			}
		}

		console.log("\n✅ Marmite deletion complete!");
	} catch (error) {
		console.error("❌ Error deleting marmite:", error);
		throw error;
	}
}

deleteMarmite();
