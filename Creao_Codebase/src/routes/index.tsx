import { type IntakeModel, IntakeORM } from "@/components/data/orm/orm_intake";
import { type ItemModel, ItemORM } from "@/components/data/orm/orm_item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useBundleValidatorMutation } from "@/hooks/use-bundle-validator";
import {
	type ClassifyFoodsResponse,
	useClassifyFoodsMutation,
} from "@/hooks/use-classify-foods";
import {
	type ImgRecModelResponse,
	useImgRecModelMutation,
} from "@/hooks/use-img-rec-model";
import {
	type OpenFoodFactsProduct,
	useOpenFoodFactsMutation,
} from "@/hooks/use-openfoodfacts";
import {
	type GenerateRecipesResponse,
	type InventoryItem,
	type RecipeSuggestion,
	useRecipeGeneratorMutation,
} from "@/hooks/use-recipe-generator";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Camera,
	ChevronRight,
	Copy,
	Eye,
	Minus,
	Package,
	Plus,
	ScanBarcode,
	Search,
	Trash2,
	Utensils,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
	component: App,
});

type Tab = "inventory" | "camera" | "recipes" | "product-detail";

interface InventoryItemWithIntakes extends ItemModel {
	totalQty: number;
	totalWeight: number;
	intakeCount: number;
	// Parsed unit information
	unitSize: number; // e.g., 250 for "250g"
	unitType: string; // e.g., "g" for "250g"
}

interface EditingItem {
	label: string;
	quantity: number;
	unit: string;
	imageUrl?: string;
	// OpenFoodFacts product data
	productData?: OpenFoodFactsProduct;
}

interface ProductDetailViewProps {
	product: OpenFoodFactsProduct;
	onBack: () => void;
	onSave: (data: { name: string; quantity: number; unit: string }) => void;
}

function App() {
	const [activeTab, setActiveTab] = useState<Tab>("inventory");
	const [selectedProduct, setSelectedProduct] =
		useState<OpenFoodFactsProduct | null>(null);

	const handleProductSelect = (product: OpenFoodFactsProduct) => {
		setSelectedProduct(product);
		setActiveTab("product-detail");
	};

	const handleProductSave = (data: {
		name: string;
		quantity: number;
		unit: string;
	}) => {
		// This will be handled by CameraView's save mutation
		setActiveTab("inventory");
		setSelectedProduct(null);
	};

	const handleProductBack = () => {
		setActiveTab("camera");
		setSelectedProduct(null);
	};

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Main content */}
			<div className="flex-1 overflow-auto pb-20">
				{activeTab === "inventory" && <InventoryView />}
				{activeTab === "camera" && (
					<CameraView onProductFound={handleProductSelect} />
				)}
				{activeTab === "recipes" && <BundlesView />}
				{activeTab === "product-detail" && selectedProduct && (
					<ProductDetailView
						product={selectedProduct}
						onBack={handleProductBack}
						onSave={handleProductSave}
					/>
				)}
			</div>

			{/* Bottom navigation */}
			<nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-4 z-50">
				<button
					type="button"
					onClick={() => setActiveTab("inventory")}
					className={cn(
						"flex flex-col items-center justify-center h-12 w-20 rounded-lg transition-colors",
						activeTab === "inventory"
							? "text-primary bg-primary/10"
							: "text-muted-foreground",
					)}
				>
					<Package className="h-6 w-6" />
					<span className="text-xs mt-1">Inventory</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("camera")}
					className={cn(
						"flex flex-col items-center justify-center h-12 w-20 rounded-lg transition-colors",
						activeTab === "camera"
							? "text-primary bg-primary/10"
							: "text-muted-foreground",
					)}
				>
					<Camera className="h-6 w-6" />
					<span className="text-xs mt-1">Camera</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("recipes")}
					className={cn(
						"flex flex-col items-center justify-center h-12 w-20 rounded-lg transition-colors",
						activeTab === "recipes"
							? "text-primary bg-primary/10"
							: "text-muted-foreground",
					)}
				>
					<Utensils className="h-6 w-6" />
					<span className="text-xs mt-1">Recipes</span>
				</button>
			</nav>
		</div>
	);
}

function InventoryView() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedItem, setSelectedItem] =
		useState<InventoryItemWithIntakes | null>(null);
	const [quantityInput, setQuantityInput] = useState("");
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
	const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
	const queryClient = useQueryClient();

	// Fetch items and intakes
	const { data: items = [], isLoading: itemsLoading } = useQuery({
		queryKey: ["items"],
		queryFn: async () => {
			const orm = ItemORM.getInstance();
			return await orm.getAllItem();
		},
	});

	const { data: intakes = [], isLoading: intakesLoading } = useQuery({
		queryKey: ["intakes"],
		queryFn: async () => {
			const orm = IntakeORM.getInstance();
			return await orm.getAllIntake();
		},
	});

	// Helper function to parse unit (e.g., "250g" -> {size: 250, type: "g"})
	const parseUnit = (unit: string): { size: number; type: string } => {
		const match = unit.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
		if (match) {
			return { size: Number.parseFloat(match[1]), type: match[2] };
		}
		// If no number prefix, assume size is 1
		return { size: 1, type: unit };
	};

	// Helper function to auto-convert units when they get large
	const formatQuantity = (
		amount: number,
		unit: string,
	): { value: number; unit: string } => {
		// Weight conversions
		if (unit === "g" && amount >= 1000) {
			return { value: amount / 1000, unit: "kg" };
		}
		if (unit === "kg" && amount >= 1000) {
			return { value: amount / 1000, unit: "t" }; // metric ton
		}

		// Volume conversions
		if (unit === "ml" && amount >= 1000) {
			return { value: amount / 1000, unit: "l" };
		}

		// US weight conversions
		if (unit === "oz" && amount >= 16) {
			return { value: amount / 16, unit: "lb" };
		}

		// Keep original if no conversion needed
		return { value: amount, unit };
	};

	// Calculate inventory with aggregations
	const inventory: InventoryItemWithIntakes[] = items.map((item) => {
		const itemIntakes = intakes.filter((intake) => intake.item_id === item.id);
		const totalQty = itemIntakes.reduce((sum, i) => sum + i.qty, 0);
		const totalWeight = itemIntakes.reduce(
			(sum, i) => sum + (i.weight_kg || 0),
			0,
		);

		const { size: unitSize, type: unitType } = parseUnit(item.unit);

		// Debug log for image URLs
		if (item.image_url) {
			console.log(`[InventoryView] Item "${item.name}" has image_url:`, {
				id: item.id,
				image_url: item.image_url,
				length: item.image_url.length,
			});
		}

		return {
			...item,
			totalQty,
			totalWeight,
			intakeCount: itemIntakes.length,
			unitSize,
			unitType,
		};
	});

	// Get all unique allergens and dietary tags from inventory
	const allAllergens = new Set<string>();
	const allDietaryTags = new Set<string>();
	for (const item of inventory) {
		if (item.allergens) {
			for (const allergen of item.allergens) {
				allAllergens.add(allergen);
			}
		}
		if (item.dietary_tags) {
			for (const tag of item.dietary_tags) {
				allDietaryTags.add(tag);
			}
		}
	}

	// Filter inventory
	const filteredInventory = inventory.filter((item) => {
		const matchesSearch = item.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());

		// Filter by allergens - exclude items with selected allergens
		const hasExcludedAllergen =
			selectedAllergens.length > 0 &&
			selectedAllergens.some((allergen) => item.allergens?.includes(allergen));

		// Filter by dietary tags - include only items with all selected dietary tags
		const matchesDietaryTags =
			selectedDietaryTags.length === 0 ||
			selectedDietaryTags.every((tag) => item.dietary_tags?.includes(tag));

		return matchesSearch && !hasExcludedAllergen && matchesDietaryTags;
	});

	const isLoading = itemsLoading || intakesLoading;

	// Quick stock adjustment mutation
	const quickAdjust = useMutation({
		mutationFn: async ({
			itemId,
			qtyChange,
		}: { itemId: string; qtyChange: number }) => {
			const intakeOrm = IntakeORM.getInstance();
			await intakeOrm.insertIntake([
				{
					item_id: itemId,
					qty: qtyChange,
					source: "Quick adjustment",
				} as IntakeModel,
			]);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			toast.success("Stock updated");
		},
		onError: () => {
			toast.error("Failed to update stock");
		},
	});

	// Set absolute quantity mutation
	const setAbsoluteQuantity = useMutation({
		mutationFn: async ({
			itemId,
			newQty,
			currentQty,
		}: { itemId: string; newQty: number; currentQty: number }) => {
			const qtyChange = newQty - currentQty;
			if (qtyChange !== 0) {
				const intakeOrm = IntakeORM.getInstance();
				await intakeOrm.insertIntake([
					{
						item_id: itemId,
						qty: qtyChange,
						source: "Manual quantity adjustment",
					} as IntakeModel,
				]);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			toast.success("Quantity updated");
			setQuantityInput("");
		},
		onError: () => {
			toast.error("Failed to update quantity");
		},
	});

	// Delete item mutation
	const deleteItem = useMutation({
		mutationFn: async (itemId: string) => {
			const itemOrm = ItemORM.getInstance();
			const intakeOrm = IntakeORM.getInstance();

			// First delete all intakes for this item
			const itemIntakes = intakes.filter((intake) => intake.item_id === itemId);
			for (const intake of itemIntakes) {
				await intakeOrm.deleteIntakeById(intake.id);
			}

			// Then delete the item
			await itemOrm.deleteItemById(itemId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			setSelectedItem(null);
			toast.success("Item deleted");
		},
		onError: () => {
			toast.error("Failed to delete item");
		},
	});

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<header className="mb-6">
				<h1 className="text-2xl font-bold mb-2">Inventory</h1>
				<p className="text-muted-foreground text-sm">
					Manage food bank stock levels
				</p>
			</header>

			{/* Search */}
			<div className="mb-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Filters */}
			<div className="mb-4 space-y-3">
				{/* Dietary Preferences Filter */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-muted-foreground">
						Dietary Preferences
					</Label>
					<div className="flex flex-wrap gap-2">
						{[
							"vegan",
							"vegetarian",
							"gluten-free",
							"palm-oil-free",
							"dairy-free",
						].map((tag) => {
							const isSelected = selectedDietaryTags.includes(tag);
							const tagLabel = tag
								.split("-")
								.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
								.join(" ");
							return (
								<Button
									key={tag}
									variant={isSelected ? "default" : "outline"}
									size="sm"
									onClick={() => {
										setSelectedDietaryTags((prev) =>
											isSelected
												? prev.filter((t) => t !== tag)
												: [...prev, tag],
										);
									}}
								>
									{tagLabel}
								</Button>
							);
						})}
					</div>
				</div>

				{/* Allergen Exclusion Filter */}
				{allAllergens.size > 0 && (
					<div className="space-y-2">
						<Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
							<AlertCircle className="h-3.5 w-3.5" />
							Exclude Allergens
						</Label>
						<div className="flex flex-wrap gap-2">
							{Array.from(allAllergens)
								.sort()
								.map((allergen) => {
									const isSelected = selectedAllergens.includes(allergen);
									return (
										<Button
											key={allergen}
											variant={isSelected ? "destructive" : "outline"}
											size="sm"
											onClick={() => {
												setSelectedAllergens((prev) =>
													isSelected
														? prev.filter((a) => a !== allergen)
														: [...prev, allergen],
												);
											}}
										>
											{allergen}
										</Button>
									);
								})}
						</div>
					</div>
				)}

				{/* Active filters indicator */}
				{(selectedAllergens.length > 0 || selectedDietaryTags.length > 0) && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{filteredInventory.length} of {inventory.length} items shown
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSelectedAllergens([]);
								setSelectedDietaryTags([]);
							}}
						>
							<X className="h-3 w-3 mr-1" />
							Clear filters
						</Button>
					</div>
				)}
			</div>

			{/* Inventory list */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3, 4, 5].map((i) => (
						<Skeleton key={i} className="h-24 w-full" />
					))}
				</div>
			) : filteredInventory.length === 0 ? (
				<Card className="p-12 text-center">
					<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-semibold mb-2">No items found</h3>
					<p className="text-sm text-muted-foreground mb-4">
						{searchQuery
							? "Try adjusting your search"
							: "Get started by adding items via the camera"}
					</p>
				</Card>
			) : (
				<div className="space-y-3">
					{filteredInventory.map((item) => (
						<Card
							key={item.id}
							className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
							onClick={() => setSelectedItem(item)}
						>
							<div className="flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2 mb-2">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold truncate">{item.name}</h3>
											<p className="text-xs text-muted-foreground mt-1">
												{item.unitSize} {item.unitType} per unit
											</p>
											<p className="text-sm text-foreground font-medium mt-1">
												Total: {item.totalQty}{" "}
												{item.totalQty === 1 ? "unit" : "units"} ({(() => {
													const totalAmount = item.totalQty * item.unitSize;
													const converted = formatQuantity(
														totalAmount,
														item.unitType,
													);
													// Format number nicely - remove decimals if whole number
													const formattedValue =
														converted.value % 1 === 0
															? converted.value
															: converted.value.toFixed(2);
													return `${formattedValue} ${converted.unit}`;
												})()})
											</p>
										</div>
										<div className="flex gap-2 flex-wrap justify-end">
											{item.totalQty < 10 && (
												<Badge
													variant="destructive"
													className="whitespace-nowrap"
												>
													Low Stock
												</Badge>
											)}
										</div>
									</div>

									{/* Quick adjust buttons */}
									<div className="flex items-center gap-2 mt-3">
										<Button
											size="sm"
											variant="outline"
											onClick={(e) => {
												e.stopPropagation();
												quickAdjust.mutate({ itemId: item.id, qtyChange: -1 });
											}}
											disabled={quickAdjust.isPending}
										>
											<Minus className="h-4 w-4" />
										</Button>
										<span className="text-sm text-muted-foreground min-w-[60px] text-center">
											Quick adjust
										</span>
										<Button
											size="sm"
											variant="outline"
											onClick={(e) => {
												e.stopPropagation();
												quickAdjust.mutate({ itemId: item.id, qtyChange: 1 });
											}}
											disabled={quickAdjust.isPending}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>
								{/* Item image */}
								{item.image_url && (
									<div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
										<img
											src={item.image_url}
											alt={item.name}
											className="w-full h-full object-cover"
										/>
									</div>
								)}
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Nutritional Detail Dialog */}
			<Dialog
				open={!!selectedItem}
				onOpenChange={(open) => !open && setSelectedItem(null)}
			>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					{selectedItem && (
						<>
							<DialogHeader>
								<DialogTitle className="text-2xl">
									{selectedItem.name}
								</DialogTitle>
								<DialogDescription>
									Nutritional information and details
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-6 mt-4">
								{/* Image with dynamic aspect ratio */}
								{selectedItem.image_url && (
									<div className="w-full rounded-lg overflow-hidden bg-muted">
										<img
											src={selectedItem.image_url}
											alt={selectedItem.name}
											className="w-full h-auto object-contain"
										/>
									</div>
								)}

								{/* Basic Info */}
								<div className="grid grid-cols-2 gap-4">
									<Card>
										<CardHeader className="pb-3">
											<CardDescription className="text-xs">
												Unit Size
											</CardDescription>
											<CardTitle className="text-lg">
												{selectedItem.unitSize} {selectedItem.unitType}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader className="pb-3">
											<CardDescription className="text-xs">
												Total Quantity
											</CardDescription>
											<CardTitle className="text-lg">
												{selectedItem.totalQty}{" "}
												{selectedItem.totalQty === 1 ? "unit" : "units"}
											</CardTitle>
										</CardHeader>
									</Card>
								</div>

								{/* Quantity Adjustment Section */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Adjust Quantity</CardTitle>
										<CardDescription>
											Update stock levels using quick adjust or set exact amount
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Quick adjust buttons */}
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													quickAdjust.mutate({
														itemId: selectedItem.id,
														qtyChange: -1,
													});
												}}
												disabled={quickAdjust.isPending}
											>
												<Minus className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground min-w-[80px] text-center">
												Quick adjust
											</span>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													quickAdjust.mutate({
														itemId: selectedItem.id,
														qtyChange: 1,
													});
												}}
												disabled={quickAdjust.isPending}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>

										{/* Set exact quantity */}
										<div className="space-y-2">
											<Label htmlFor="quantity-input">Set Exact Quantity</Label>
											<div className="flex gap-2">
												<Input
													id="quantity-input"
													type="number"
													min="0"
													placeholder={`Current: ${selectedItem.totalQty}`}
													value={quantityInput}
													onChange={(e) => setQuantityInput(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															const newQty = Number.parseInt(quantityInput);
															if (!Number.isNaN(newQty) && newQty >= 0) {
																setAbsoluteQuantity.mutate({
																	itemId: selectedItem.id,
																	newQty,
																	currentQty: selectedItem.totalQty,
																});
															} else {
																toast.error("Please enter a valid quantity");
															}
														}
													}}
												/>
												<Button
													onClick={() => {
														const newQty = Number.parseInt(quantityInput);
														if (!Number.isNaN(newQty) && newQty >= 0) {
															setAbsoluteQuantity.mutate({
																itemId: selectedItem.id,
																newQty,
																currentQty: selectedItem.totalQty,
															});
														} else {
															toast.error("Please enter a valid quantity");
														}
													}}
													disabled={
														setAbsoluteQuantity.isPending || !quantityInput
													}
												>
													Set
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Nutritional Information */}
								{(selectedItem.calories !== null ||
									selectedItem.protein !== null ||
									selectedItem.fat !== null ||
									selectedItem.carbs !== null ||
									selectedItem.fiber !== null ||
									selectedItem.sugars !== null ||
									selectedItem.sodium !== null) && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">
												Nutritional Information
											</CardTitle>
											<CardDescription>
												Per {selectedItem.unitSize}
												{selectedItem.unitType} serving
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{selectedItem.calories !== null && (
													<div className="flex justify-between items-center border-b pb-2">
														<span className="font-medium">Calories</span>
														<span className="text-lg font-semibold">
															{selectedItem.calories} kcal
														</span>
													</div>
												)}

												{selectedItem.protein !== null && (
													<div className="flex justify-between items-center">
														<span className="text-sm">Protein</span>
														<span className="font-medium">
															{selectedItem.protein}g
														</span>
													</div>
												)}

												{selectedItem.carbs !== null && (
													<div className="flex justify-between items-center">
														<span className="text-sm">Carbohydrates</span>
														<span className="font-medium">
															{selectedItem.carbs}g
														</span>
													</div>
												)}

												{selectedItem.fiber !== null && (
													<div className="flex justify-between items-center pl-4">
														<span className="text-xs text-muted-foreground">
															• Fiber
														</span>
														<span className="text-sm">
															{selectedItem.fiber}g
														</span>
													</div>
												)}

												{selectedItem.sugars !== null && (
													<div className="flex justify-between items-center pl-4">
														<span className="text-xs text-muted-foreground">
															• Sugars
														</span>
														<span className="text-sm">
															{selectedItem.sugars}g
														</span>
													</div>
												)}

												{selectedItem.fat !== null && (
													<div className="flex justify-between items-center">
														<span className="text-sm">Fat</span>
														<span className="font-medium">
															{selectedItem.fat}g
														</span>
													</div>
												)}

												{selectedItem.sodium !== null && (
													<div className="flex justify-between items-center">
														<span className="text-sm">Sodium</span>
														<span className="font-medium">
															{selectedItem.sodium}mg
														</span>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Allergens */}
								{selectedItem.allergens &&
									selectedItem.allergens.length > 0 && (
										<Card>
											<CardHeader>
												<CardTitle className="text-lg flex items-center gap-2">
													<AlertCircle className="h-5 w-5 text-destructive" />
													Allergen Warning
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="flex flex-wrap gap-2">
													{selectedItem.allergens.map((allergen) => (
														<Badge
															key={allergen}
															variant="destructive"
															className="text-sm"
														>
															{allergen}
														</Badge>
													))}
												</div>
											</CardContent>
										</Card>
									)}

								{/* Dietary Tags */}
								{selectedItem.dietary_tags &&
									selectedItem.dietary_tags.length > 0 && (
										<Card>
											<CardHeader>
												<CardTitle className="text-lg">
													Dietary Information
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="flex flex-wrap gap-2">
													{selectedItem.dietary_tags.map((tag) => (
														<Badge
															key={tag}
															variant="secondary"
															className="text-sm"
														>
															{tag}
														</Badge>
													))}
												</div>
											</CardContent>
										</Card>
									)}

								{/* Delete Item Button */}
								<div className="pt-4 border-t">
									<Button
										variant="destructive"
										onClick={() => {
											if (
												confirm(
													`Are you sure you want to delete "${selectedItem.name}"? This will remove all intake records for this item.`,
												)
											) {
												deleteItem.mutate(selectedItem.id);
											}
										}}
										disabled={deleteItem.isPending}
										className="w-full"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										{deleteItem.isPending
											? "Deleting..."
											: "Delete Item from Inventory"}
									</Button>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ProductDetailView({
	product,
	onBack,
	onSave,
}: ProductDetailViewProps) {
	const [editedName, setEditedName] = useState(
		product.product_name_en ||
			product.generic_name_en ||
			`Product ${product.code}`,
	);
	const [editedQuantity, setEditedQuantity] = useState(() => {
		if (product.product_quantity && product.product_quantity_unit) {
			return product.product_quantity;
		}
		if (product.serving_quantity && product.serving_quantity_unit) {
			return product.serving_quantity;
		}
		return 1;
	});
	const [editedUnit, setEditedUnit] = useState(() => {
		if (product.product_quantity_unit) {
			return product.product_quantity_unit;
		}
		if (product.serving_quantity_unit) {
			return product.serving_quantity_unit;
		}
		return "ea";
	});
	const [editedImageUrl, setEditedImageUrl] = useState(() => {
		// Auto-populate with OpenFoodFacts image URL
		return product.image_url || "";
	});

	const queryClient = useQueryClient();

	// Update state when product changes (important for barcode scans)
	useEffect(() => {
		console.log("[ProductDetailView] Updating state with new product:", {
			code: product.code,
			imageUrl: product.image_url,
		});

		setEditedName(
			product.product_name_en ||
				product.generic_name_en ||
				`Product ${product.code}`,
		);
		setEditedQuantity(
			product.product_quantity || product.serving_quantity || 1,
		);
		setEditedUnit(
			product.product_quantity_unit || product.serving_quantity_unit || "ea",
		);

		const imageUrl = product.image_url || "";

		console.log("[ProductDetailView] Setting image URL to:", imageUrl);
		setEditedImageUrl(imageUrl);
	}, [product]);

	// Save item mutation
	const saveItemMutation = useMutation({
		mutationFn: async (itemData: {
			name: string;
			quantity: number;
			unit: string;
			barcode: string;
			imageUrl?: string;
			productData?: OpenFoodFactsProduct;
		}) => {
			const itemOrm = ItemORM.getInstance();
			const intakeOrm = IntakeORM.getInstance();

			console.log("[ProductDetailView] saveItemMutation called with:", {
				name: itemData.name,
				barcode: itemData.barcode,
				imageUrl: itemData.imageUrl,
				imageUrlLength: itemData.imageUrl?.length,
				productData: itemData.productData,
			});

			// Format unit as "quantity + unit" (e.g., "250g")
			const formattedUnit = `${itemData.quantity}${itemData.unit}`;

			// Create or find item - first check by barcode
			let existing: ItemModel | undefined;
			const itemsByBarcode = await itemOrm.getItemByUpc(itemData.barcode);
			existing = itemsByBarcode[0];

			// If not found by barcode, try by name
			if (!existing) {
				const existingItems = await itemOrm.getAllItem();
				existing = existingItems.find(
					(item: ItemModel) =>
						item.name.toLowerCase() === itemData.name.toLowerCase(),
				);
			}

			let itemId: string;
			if (existing) {
				itemId = existing.id;
				console.log(
					"[ProductDetailView] Updating existing item:",
					existing.id,
					{
						existingImageUrl: existing.image_url,
						newImageUrl: itemData.imageUrl,
					},
				);
				// Update barcode, unit, image_url, and nutritional data if they're different or not set
				const needsUpdate =
					!existing.upc ||
					existing.unit !== formattedUnit ||
					(itemData.imageUrl && itemData.imageUrl !== existing.image_url) ||
					(itemData.productData && (!existing.brand || !existing.category)); // Update if we have new nutritional data

				if (needsUpdate) {
					const updatedItem = {
						...existing,
						upc: itemData.barcode,
						unit: formattedUnit,
						image_url: itemData.imageUrl || existing.image_url,
						// Update nutritional data from OpenFoodFacts if available
						brand: itemData.productData?.brand || existing.brand,
						category: itemData.productData?.category || existing.category,
						calories: itemData.productData?.calories ?? existing.calories,
						protein: itemData.productData?.protein ?? existing.protein,
						carbs: itemData.productData?.carbohydrates ?? existing.carbs,
						fiber: itemData.productData?.fiber ?? existing.fiber,
						sugars: itemData.productData?.sugars ?? existing.sugars,
						fat: itemData.productData?.fat ?? existing.fat,
						sodium: itemData.productData?.sodium ?? existing.sodium,
						// Save allergens from OpenFoodFacts
						allergens:
							itemData.productData?.allergens_tags?.map((tag) =>
								tag.replace("en:", "").replace(/-/g, " "),
							) ?? existing.allergens,
						// Save dietary tags from OpenFoodFacts
						dietary_tags:
							itemData.productData?.ingredients_analysis_tags?.map((tag) =>
								tag.replace("en:", "").replace(/-/g, " "),
							) ?? existing.dietary_tags,
					};
					console.log(
						"[ProductDetailView] Calling setItemById with:",
						updatedItem,
					);
					await itemOrm.setItemById(itemId, updatedItem);
				} else {
					console.log(
						"[ProductDetailView] No update needed - all fields match",
					);
				}
			} else {
				const newItem = {
					name: itemData.name,
					upc: itemData.barcode,
					unit: formattedUnit,
					image_url: itemData.imageUrl || null,
					// Include nutritional data from OpenFoodFacts if available
					brand: itemData.productData?.brand || null,
					category: itemData.productData?.category || null,
					calories: itemData.productData?.calories ?? null,
					protein: itemData.productData?.protein ?? null,
					carbs: itemData.productData?.carbohydrates ?? null,
					fiber: itemData.productData?.fiber ?? null,
					sugars: itemData.productData?.sugars ?? null,
					fat: itemData.productData?.fat ?? null,
					sodium: itemData.productData?.sodium ?? null,
					// Save allergens from OpenFoodFacts
					allergens:
						itemData.productData?.allergens_tags?.map((tag) =>
							tag.replace("en:", "").replace(/-/g, " "),
						) ?? null,
					// Save dietary tags from OpenFoodFacts
					dietary_tags:
						itemData.productData?.ingredients_analysis_tags?.map((tag) =>
							tag.replace("en:", "").replace(/-/g, " "),
						) ?? null,
				} as ItemModel;
				console.log("[ProductDetailView] Creating new item:", newItem);
				const newItems = await itemOrm.insertItem([newItem]);
				itemId = newItems[0].id;
				console.log("[ProductDetailView] Created item with ID:", itemId, {
					returnedImageUrl: newItems[0].image_url,
				});
			}

			// Create intake record with qty=1 (one unit)
			await intakeOrm.insertIntake([
				{
					item_id: itemId,
					qty: 1,
					source: `Barcode: ${itemData.barcode}`,
				} as IntakeModel,
			]);

			return itemId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			toast.success("Item added to inventory");
			onSave({
				name: editedName,
				quantity: editedQuantity,
				unit: editedUnit,
			});
		},
		onError: () => {
			toast.error("Failed to save item");
		},
	});

	const handleSave = () => {
		saveItemMutation.mutate({
			name: editedName,
			quantity: editedQuantity,
			unit: editedUnit,
			barcode: product.code,
			imageUrl: editedImageUrl,
			productData: product,
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
				<div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onBack}>
						<X className="h-5 w-5" />
					</Button>
					<div className="flex-1">
						<h1 className="text-xl font-bold">Product Details</h1>
						<p className="text-sm text-muted-foreground">
							Barcode: {product.code}
						</p>
					</div>
					<Badge variant="secondary">OpenFoodFacts</Badge>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
				{/* Product Image */}
				{editedImageUrl && (
					<Card className="overflow-hidden">
						<div className="w-full h-64 bg-muted flex items-center justify-center">
							<img
								src={editedImageUrl}
								alt={editedName}
								className="w-full h-full object-contain"
								onError={(e) => {
									// Hide image if it fails to load
									e.currentTarget.style.display = "none";
								}}
							/>
						</div>
					</Card>
				)}

				{/* Product Name Card */}
				<Card className="overflow-hidden">
					<CardHeader className="bg-primary/5">
						<CardTitle className="text-2xl">{editedName}</CardTitle>
						{product.generic_name_en &&
							product.generic_name_en !== editedName && (
								<CardDescription className="text-base">
									{product.generic_name_en}
								</CardDescription>
							)}
					</CardHeader>
				</Card>

				{/* Quick Info Grid */}
				<div className="grid grid-cols-2 gap-4">
					{product.brand && (
						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="text-xs">Brand</CardDescription>
								<CardTitle className="text-lg">{product.brand}</CardTitle>
							</CardHeader>
						</Card>
					)}
					{product.category && (
						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="text-xs">Category</CardDescription>
								<CardTitle className="text-lg">{product.category}</CardTitle>
							</CardHeader>
						</Card>
					)}
					{product.quantity && (
						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="text-xs">
									Package Size
								</CardDescription>
								<CardTitle className="text-lg">{product.quantity}</CardTitle>
							</CardHeader>
						</Card>
					)}
					{product.serving_size && (
						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="text-xs">
									Serving Size
								</CardDescription>
								<CardTitle className="text-lg">
									{product.serving_size}
								</CardTitle>
							</CardHeader>
						</Card>
					)}
				</div>

				{/* Nutritional Information */}
				{(product.calories !== undefined ||
					product.protein !== undefined ||
					product.carbohydrates !== undefined ||
					product.fiber !== undefined ||
					product.sugars !== undefined ||
					product.fat !== undefined ||
					product.sodium !== undefined) && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Nutritional Information</CardTitle>
							<CardDescription>
								Per {product.serving_size || "serving"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{product.calories !== undefined && (
									<div className="flex justify-between items-center border-b pb-2">
										<span className="font-medium">Calories</span>
										<span className="text-lg font-semibold">
											{product.calories} kcal
										</span>
									</div>
								)}

								{product.protein !== undefined && (
									<div className="flex justify-between items-center">
										<span className="text-sm">Protein</span>
										<span className="font-medium">{product.protein}g</span>
									</div>
								)}

								{product.carbohydrates !== undefined && (
									<div className="flex justify-between items-center">
										<span className="text-sm">Carbohydrates</span>
										<span className="font-medium">
											{product.carbohydrates}g
										</span>
									</div>
								)}

								{product.fiber !== undefined && (
									<div className="flex justify-between items-center pl-4">
										<span className="text-xs text-muted-foreground">
											• Fiber
										</span>
										<span className="text-sm">{product.fiber}g</span>
									</div>
								)}

								{product.sugars !== undefined && (
									<div className="flex justify-between items-center pl-4">
										<span className="text-xs text-muted-foreground">
											• Sugars
										</span>
										<span className="text-sm">{product.sugars}g</span>
									</div>
								)}

								{product.fat !== undefined && (
									<div className="flex justify-between items-center">
										<span className="text-sm">Fat</span>
										<span className="font-medium">{product.fat}g</span>
									</div>
								)}

								{product.sodium !== undefined && (
									<div className="flex justify-between items-center">
										<span className="text-sm">Sodium</span>
										<span className="font-medium">{product.sodium}mg</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Allergens */}
				{product.allergens_tags && product.allergens_tags.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-destructive" />
								Allergen Warning
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{product.allergens_tags.map((allergen) => (
									<Badge
										key={allergen}
										variant="destructive"
										className="text-sm"
									>
										{allergen.replace("en:", "").replace(/-/g, " ")}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Dietary Info */}
				{product.ingredients_analysis_tags &&
					product.ingredients_analysis_tags.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Dietary Information</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{product.ingredients_analysis_tags.map((tag) => (
										<Badge key={tag} variant="outline" className="text-sm">
											{tag.replace("en:", "").replace(/-/g, " ")}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

				{/* Ingredients */}
				{product.ingredients_text_en && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Ingredients</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-relaxed text-foreground/90">
								{product.ingredients_text_en}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Edit Inventory Details */}
				<Card className="border-2 border-primary/20">
					<CardHeader>
						<CardTitle className="text-lg">Add to Inventory</CardTitle>
						<CardDescription>
							Adjust the details before saving to your inventory
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="item-name">Item Name</Label>
							<Input
								id="item-name"
								value={editedName}
								onChange={(e) => setEditedName(e.target.value)}
								className="mt-1"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="quantity">Quantity per Unit</Label>
								<Input
									id="quantity"
									type="number"
									value={editedQuantity}
									onChange={(e) =>
										setEditedQuantity(Number.parseFloat(e.target.value) || 0)
									}
									className="mt-1"
								/>
							</div>

							<div>
								<Label htmlFor="unit">Unit Type</Label>
								<Select value={editedUnit} onValueChange={setEditedUnit}>
									<SelectTrigger id="unit" className="mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ea">Each (ea)</SelectItem>
										<SelectItem value="g">Grams (g)</SelectItem>
										<SelectItem value="kg">Kilograms (kg)</SelectItem>
										<SelectItem value="ml">Milliliters (ml)</SelectItem>
										<SelectItem value="l">Liters (l)</SelectItem>
										<SelectItem value="oz">Ounces (oz)</SelectItem>
										<SelectItem value="lb">Pounds (lb)</SelectItem>
										<SelectItem value="can">Can</SelectItem>
										<SelectItem value="box">Box</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Show image URL info if auto-populated from API */}
						{editedImageUrl && (
							<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
								<div className="flex items-start gap-2">
									<div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
										<svg
											className="h-3 w-3 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Success checkmark"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
									<div className="flex-1">
										<p className="text-xs font-medium text-green-700 dark:text-green-300">
											Product image automatically loaded from OpenFoodFacts
										</p>
										<p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5 truncate">
											{editedImageUrl}
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
							<p>
								This defines one unit of the product. For example, if this is a
								250g jar, set quantity to 250 and unit to g. When you add or
								remove units in inventory, it will adjust by this amount (1 unit
								= 250g).
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Action Buttons */}
				<div className="flex gap-3 pb-8">
					<Button
						variant="outline"
						onClick={onBack}
						className="flex-1"
						size="lg"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={saveItemMutation.isPending}
						className="flex-1"
						size="lg"
					>
						{saveItemMutation.isPending ? "Saving..." : "Save to Inventory"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function CameraView({
	onProductFound,
}: { onProductFound: (product: OpenFoodFactsProduct) => void }) {
	const [mode, setMode] = useState<"barcode" | "vision">("vision");
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [showResultSheet, setShowResultSheet] = useState(false);
	const [classificationResult, setClassificationResult] =
		useState<ClassifyFoodsResponse | null>(null);
	const [imgRecResult, setImgRecResult] = useState<ImgRecModelResponse | null>(
		null,
	);
	const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
	const [manualBarcode, setManualBarcode] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const classifyFoods = useClassifyFoodsMutation();
	const lookupBarcode = useOpenFoodFactsMutation();
	const recognizeFood = useImgRecModelMutation();

	// Helper function to convert base64 data URL to JPG Blob
	const dataURLToBlob = useCallback((dataURL: string): Promise<Blob> => {
		return new Promise((resolve, reject) => {
			// Create an image element to load the data URL
			const img = new Image();
			img.onload = () => {
				// Create a canvas to convert the image to JPG
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}

				// Draw the image onto the canvas
				ctx.drawImage(img, 0, 0);

				// Convert canvas to JPG blob
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error("Failed to convert image to JPG blob"));
						}
					},
					"image/jpeg",
					0.95, // Quality setting (0-1)
				);
			};
			img.onerror = () => {
				reject(new Error("Failed to load image"));
			};
			img.src = dataURL;
		});
	}, []);

	// Handle file upload
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			// Validate file type
			if (!file.type.startsWith("image/")) {
				toast.error("Please select an image file");
				return;
			}

			// Read file as data URL
			const reader = new FileReader();
			reader.onload = (e) => {
				const imageData = e.target?.result as string;
				setUploadedImage(imageData);

				// Classify if in vision mode
				if (mode === "vision") {
					classifyFoods.mutate(
						{ imageUrl: imageData },
						{
							onSuccess: (data) => {
								setClassificationResult(data);
								setShowResultSheet(true);
								if (data.items.length > 0) {
									setEditingItem({
										label: data.items[0].label,
										quantity: data.items[0].quantity,
										unit: "ea",
									});
								}

								// After vision classification succeeds, call ImgRecModel API
								console.log(
									"[CameraView] Vision classification complete, calling ImgRecModel API...",
								);

								dataURLToBlob(imageData)
									.then((blob) => {
										console.log("[CameraView] Converted image to blob:", {
											size: blob.size,
											type: blob.type,
										});

										recognizeFood.mutate(
											{ imageBlob: blob },
											{
												onSuccess: (imgRecData) => {
													console.log(
														"[CameraView] ImgRecModel API success:",
														imgRecData,
													);
													setImgRecResult(imgRecData);
													toast.success(
														`ImgRecModel detected ${imgRecData.items.length} food items with nutritional info`,
													);
												},
												onError: (error) => {
													console.error(
														"[CameraView] ImgRecModel API error:",
														error,
													);
													toast.error(`ImgRecModel failed: ${error.message}`);
												},
											},
										);
									})
									.catch((error) => {
										console.error(
											"[CameraView] Failed to convert image to blob:",
											error,
										);
										toast.error(`Failed to convert image: ${error.message}`);
									});
							},
							onError: (error) => {
								toast.error(`Classification failed: ${error.message}`);
							},
						},
					);
				}
			};
			reader.onerror = () => {
				toast.error("Failed to read image file");
			};
			reader.readAsDataURL(file);
		},
		[mode, classifyFoods, recognizeFood, dataURLToBlob],
	);

	// Trigger file input
	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	// Save item mutation
	const saveItemMutation = useMutation({
		mutationFn: async (itemData: {
			name: string;
			quantity: number;
			unit: string;
			barcode?: string;
			imageUrl?: string;
			productData?: OpenFoodFactsProduct;
			nutritionalData?: {
				calories?: number;
				protein?: number;
				carbs?: number;
				fat?: number;
				sodium?: number;
			};
		}) => {
			const itemOrm = ItemORM.getInstance();
			const intakeOrm = IntakeORM.getInstance();

			// Format unit as "quantity + unit" (e.g., "250g")
			const formattedUnit = `${itemData.quantity}${itemData.unit}`;

			// Create or find item - first check by barcode if provided, then by name
			let existing: ItemModel | undefined;

			if (itemData.barcode) {
				const itemsByBarcode = await itemOrm.getItemByUpc(itemData.barcode);
				existing = itemsByBarcode[0];
			}

			// If not found by barcode, try by name
			if (!existing) {
				const existingItems = await itemOrm.getAllItem();
				existing = existingItems.find(
					(item: ItemModel) =>
						item.name.toLowerCase() === itemData.name.toLowerCase(),
				);
			}

			let itemId: string;
			if (existing) {
				itemId = existing.id;
				// Update barcode, unit, image_url, and nutritional data if not set or different
				const needsUpdate =
					(itemData.barcode && !existing.upc) ||
					existing.unit !== formattedUnit ||
					(itemData.imageUrl && !existing.image_url) ||
					(itemData.nutritionalData &&
						(existing.calories === null ||
							existing.protein === null ||
							existing.carbs === null ||
							existing.fat === null ||
							existing.sodium === null));

				if (needsUpdate) {
					await itemOrm.setItemById(itemId, {
						...existing,
						upc: itemData.barcode || existing.upc,
						unit: formattedUnit,
						image_url: itemData.imageUrl || existing.image_url,
						// Update nutritional data from ImgRecModel if available
						calories: itemData.nutritionalData?.calories ?? existing.calories,
						protein: itemData.nutritionalData?.protein ?? existing.protein,
						carbs: itemData.nutritionalData?.carbs ?? existing.carbs,
						fat: itemData.nutritionalData?.fat ?? existing.fat,
						sodium: itemData.nutritionalData?.sodium ?? existing.sodium,
					});
				}
			} else {
				const newItems = await itemOrm.insertItem([
					{
						name: itemData.name,
						upc: itemData.barcode || "",
						unit: formattedUnit,
						image_url: itemData.imageUrl || null,
						// Include nutritional data from ImgRecModel if available
						calories: itemData.nutritionalData?.calories ?? null,
						protein: itemData.nutritionalData?.protein ?? null,
						carbs: itemData.nutritionalData?.carbs ?? null,
						fat: itemData.nutritionalData?.fat ?? null,
						sodium: itemData.nutritionalData?.sodium ?? null,
						// fiber and sugars remain null as requested
						fiber: null,
						sugars: null,
					} as ItemModel,
				]);
				itemId = newItems[0].id;
			}

			// Create intake record with qty=1 (one unit)
			const source = itemData.barcode
				? `Barcode: ${itemData.barcode}`
				: "Photo upload";
			await intakeOrm.insertIntake([
				{
					item_id: itemId,
					qty: 1,
					source,
				} as IntakeModel,
			]);

			return itemId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			toast.success("Item added to inventory");
			setShowResultSheet(false);
			setUploadedImage(null);
			setEditingItem(null);
			setImgRecResult(null);
		},
		onError: () => {
			toast.error("Failed to save item");
		},
	});

	const handleSaveItem = () => {
		if (!editingItem) return;

		// Find nutritional data for the current item from imgRecResult
		let nutritionalData:
			| {
					calories?: number;
					protein?: number;
					carbs?: number;
					fat?: number;
					sodium?: number;
			  }
			| undefined = undefined;

		if (imgRecResult && imgRecResult.items.length > 0) {
			// Find the matching item in imgRecResult by label
			const matchingItem = imgRecResult.items.find(
				(item) => item.label.toLowerCase() === editingItem.label.toLowerCase(),
			);

			if (matchingItem) {
				nutritionalData = {
					calories: matchingItem.calories_kcal,
					protein: matchingItem.protein_g,
					carbs: matchingItem.carbohydrates_g,
					fat: matchingItem.fat_g,
					sodium: matchingItem.sodium_mg,
				};

				console.log(
					"[CameraView] Saving item with nutritional data:",
					nutritionalData,
				);
			}
		}

		saveItemMutation.mutate({
			name: editingItem.label,
			quantity: editingItem.quantity,
			unit: editingItem.unit,
			imageUrl: editingItem.imageUrl,
			barcode: editingItem.productData?.code,
			productData: editingItem.productData,
			nutritionalData,
		});
	};

	const handleBarcodeSubmit = () => {
		const barcode = manualBarcode.trim();
		if (!barcode) {
			toast.error("Please enter a barcode");
			return;
		}

		console.log("[UI] Starting barcode lookup:", { barcode });

		// Show loading toast
		const loadingToast = toast.loading("Looking up barcode...");

		// Call OpenFoodFacts API
		lookupBarcode.mutate(
			{ code: barcode },
			{
				onSuccess: (product) => {
					console.log("[UI] Barcode lookup SUCCESS:", {
						barcode,
						product,
					});

					toast.dismiss(loadingToast);
					toast.success("Product found!");

					// Navigate to product detail screen
					onProductFound(product);
					setManualBarcode("");
				},
				onError: (error) => {
					console.error("[UI] Barcode lookup ERROR:", {
						barcode,
						error,
						errorMessage: error.message,
						errorName: error.name,
						timestamp: new Date().toISOString(),
					});

					toast.dismiss(loadingToast);

					// Show detailed error with troubleshooting
					const errorMessage = error.message || "Unknown error";

					// Create detailed error toast
					toast.error(
						<div className="space-y-2">
							<p className="font-semibold">Barcode Lookup Failed</p>
							<p className="text-sm">{errorMessage}</p>
							<p className="text-xs text-muted-foreground">
								Check browser console for detailed logs
							</p>
						</div>,
						{
							duration: 6000,
						},
					);
				},
			},
		);
	};

	return (
		<div className="relative h-full bg-gradient-to-b from-background to-muted/20">
			{/* Mode toggle */}
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex bg-card/90 backdrop-blur rounded-lg p-1 gap-1">
				<button
					type="button"
					onClick={() => setMode("barcode")}
					className={cn(
						"px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
						mode === "barcode"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground",
					)}
				>
					<ScanBarcode className="h-4 w-4" />
					Barcode
				</button>
				<button
					type="button"
					onClick={() => setMode("vision")}
					className={cn(
						"px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
						mode === "vision"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground",
					)}
				>
					<Eye className="h-4 w-4" />
					Vision
				</button>
			</div>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileUpload}
				className="hidden"
			/>

			{/* Barcode mode - Manual entry only */}
			{mode === "barcode" && (
				<div className="flex flex-col h-full">
					{/* Manual barcode entry */}
					<div className="flex-1 bg-card p-8 flex items-center justify-center">
						<Card className="w-full max-w-md">
							<CardHeader className="text-center">
								<ScanBarcode className="h-16 w-16 mx-auto mb-4 text-primary" />
								<CardTitle>Enter Barcode</CardTitle>
								<CardDescription>
									Enter the product barcode to look up nutritional information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{lookupBarcode.isPending && (
									<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-sm">
										<div className="flex items-start gap-2">
											<div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse mt-0.5" />
											<p className="text-xs text-blue-700 dark:text-blue-300">
												Looking up barcode...
											</p>
										</div>
									</div>
								)}

								<div className="flex gap-2">
									<div className="flex-1">
										<Input
											id="manual-barcode"
											type="text"
											placeholder="Enter barcode number"
											value={manualBarcode}
											onChange={(e) => setManualBarcode(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && manualBarcode.trim()) {
													handleBarcodeSubmit();
												}
											}}
											className="font-mono"
											disabled={lookupBarcode.isPending}
											autoFocus
										/>
									</div>
									<Button
										onClick={handleBarcodeSubmit}
										disabled={lookupBarcode.isPending || !manualBarcode.trim()}
										size="lg"
									>
										<ScanBarcode className="h-4 w-4 mr-2" />
										Lookup
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

			{/* Vision mode - Photo upload with AI detection */}
			{mode === "vision" && (
				<div className="flex flex-col h-full">
					{/* Upload area or preview */}
					<div className="flex-1 relative bg-card">
						{uploadedImage ? (
							<>
								<img
									src={uploadedImage}
									alt="Uploaded"
									className="w-full h-full object-contain"
								/>
								<div className="absolute top-4 right-4 flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											setUploadedImage(null);
											setClassificationResult(null);
											setImgRecResult(null);
										}}
									>
										<X className="h-4 w-4 mr-2" />
										Clear
									</Button>
								</div>
							</>
						) : (
							<div className="flex items-center justify-center h-full p-8">
								<Card className="w-full max-w-md">
									<CardHeader className="text-center">
										<Eye className="h-16 w-16 mx-auto mb-4 text-primary" />
										<CardTitle>AI Food Detection</CardTitle>
										<CardDescription>
											Take a photo of food items to automatically detect and add
											them to inventory
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button
											onClick={triggerFileInput}
											size="lg"
											className="w-full"
											disabled={classifyFoods.isPending}
										>
											<Camera className="h-5 w-5 mr-2" />
											{classifyFoods.isPending
												? "Analyzing..."
												: "Take Photo of Food"}
										</Button>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Processing indicator */}
						{classifyFoods.isPending && (
							<div className="absolute top-4 left-4 right-4 z-10">
								<div className="bg-blue-500/90 text-white px-4 py-3 rounded-lg flex items-center gap-3">
									<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									<div>
										<p className="font-semibold text-sm">
											Analyzing image with AI...
										</p>
										<p className="text-xs opacity-90">
											Identifying food items in the photo
										</p>
									</div>
								</div>
							</div>
						)}

						{/* ImgRecModel Processing indicator */}
						{recognizeFood.isPending && (
							<div className="absolute top-20 left-4 right-4 z-10">
								<div className="bg-green-500/90 text-white px-4 py-3 rounded-lg flex items-center gap-3">
									<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									<div>
										<p className="font-semibold text-sm">
											Getting nutritional information...
										</p>
										<p className="text-xs opacity-90">
											Analyzing food items with ImgRecModel
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Result sheet */}
			<Sheet open={showResultSheet} onOpenChange={setShowResultSheet}>
				<SheetContent side="bottom" className="h-[80vh] overflow-auto">
					<SheetHeader>
						<SheetTitle>Edit Item Details</SheetTitle>
						<SheetDescription>
							{editingItem?.productData
								? "Review product information from OpenFoodFacts"
								: "Adjust the detected information before saving"}
						</SheetDescription>
					</SheetHeader>

					{editingItem && (
						<div className="mt-6 space-y-4">
							{/* ImgRecModel Nutritional Data */}
							{imgRecResult && imgRecResult.items.length > 0 && (
								<Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
												<svg
													className="h-5 w-5 text-white"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													role="img"
													aria-label="Success checkmark"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</div>
											Nutritional Analysis Complete
										</CardTitle>
										<CardDescription>
											ImgRecModel detected {imgRecResult.items.length} food item
											{imgRecResult.items.length > 1 ? "s" : ""} with
											nutritional information
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{imgRecResult.items.map((item) => (
											<div
												key={`${item.label}-${item.count}`}
												className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-4 space-y-2"
											>
												<div className="flex items-start justify-between">
													<div>
														<p className="font-semibold text-base">
															{item.label}
														</p>
														<p className="text-sm text-muted-foreground">
															Count: {item.count}
														</p>
													</div>
													{item.calories_kcal && (
														<Badge
															variant="secondary"
															className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
														>
															{item.calories_kcal} kcal
														</Badge>
													)}
												</div>

												{/* Nutritional Information Grid */}
												{(item.protein_g ||
													item.carbohydrates_g ||
													item.fat_g ||
													item.sodium_mg) && (
													<div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-green-200 dark:border-green-800">
														{item.protein_g !== undefined && (
															<div className="flex justify-between">
																<span className="text-muted-foreground">
																	Protein
																</span>
																<span className="font-medium">
																	{item.protein_g}g
																</span>
															</div>
														)}
														{item.carbohydrates_g !== undefined && (
															<div className="flex justify-between">
																<span className="text-muted-foreground">
																	Carbs
																</span>
																<span className="font-medium">
																	{item.carbohydrates_g}g
																</span>
															</div>
														)}
														{item.fat_g !== undefined && (
															<div className="flex justify-between">
																<span className="text-muted-foreground">
																	Fat
																</span>
																<span className="font-medium">
																	{item.fat_g}g
																</span>
															</div>
														)}
														{item.sodium_mg !== undefined && (
															<div className="flex justify-between">
																<span className="text-muted-foreground">
																	Sodium
																</span>
																<span className="font-medium">
																	{item.sodium_mg}mg
																</span>
															</div>
														)}
													</div>
												)}
											</div>
										))}
									</CardContent>
								</Card>
							)}
							{/* Product Information from OpenFoodFacts */}
							{editingItem.productData && (
								<div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
									<div className="flex items-start justify-between">
										<div>
											<p className="text-sm font-semibold">
												Product Information
											</p>
											<p className="text-xs text-muted-foreground">
												Barcode: {editingItem.productData.code}
											</p>
										</div>
										<Badge variant="secondary">OpenFoodFacts</Badge>
									</div>

									{/* Basic product details */}
									{editingItem.productData.generic_name_en && (
										<div>
											<p className="text-xs text-muted-foreground">
												Generic Name
											</p>
											<p className="text-sm">
												{editingItem.productData.generic_name_en}
											</p>
										</div>
									)}

									{editingItem.productData.quantity && (
										<div>
											<p className="text-xs text-muted-foreground">
												Package Quantity
											</p>
											<p className="text-sm">
												{editingItem.productData.quantity}
											</p>
										</div>
									)}

									{editingItem.productData.serving_size && (
										<div>
											<p className="text-xs text-muted-foreground">
												Serving Size
											</p>
											<p className="text-sm">
												{editingItem.productData.serving_size}
											</p>
										</div>
									)}

									{/* Allergens */}
									{editingItem.productData.allergens_tags &&
										editingItem.productData.allergens_tags.length > 0 && (
											<div>
												<p className="text-xs text-muted-foreground mb-1">
													Allergens
												</p>
												<div className="flex flex-wrap gap-1">
													{editingItem.productData.allergens_tags.map(
														(allergen) => (
															<Badge
																key={allergen}
																variant="destructive"
																className="text-xs"
															>
																{allergen.replace("en:", "")}
															</Badge>
														),
													)}
												</div>
											</div>
										)}

									{/* Dietary info */}
									{editingItem.productData.ingredients_analysis_tags &&
										editingItem.productData.ingredients_analysis_tags.length >
											0 && (
											<div>
												<p className="text-xs text-muted-foreground mb-1">
													Dietary Info
												</p>
												<div className="flex flex-wrap gap-1">
													{editingItem.productData.ingredients_analysis_tags.map(
														(tag) => (
															<Badge
																key={tag}
																variant="outline"
																className="text-xs"
															>
																{tag.replace("en:", "").replace(/-/g, " ")}
															</Badge>
														),
													)}
												</div>
											</div>
										)}

									{/* Ingredients */}
									{editingItem.productData.ingredients_text_en && (
										<div>
											<p className="text-xs text-muted-foreground mb-1">
												Ingredients
											</p>
											<p className="text-xs text-foreground/90 leading-relaxed">
												{editingItem.productData.ingredients_text_en}
											</p>
										</div>
									)}
								</div>
							)}

							{/* Editable fields */}
							<div>
								<Label htmlFor="item-name">Item Name</Label>
								<Input
									id="item-name"
									value={editingItem.label}
									onChange={(e) =>
										setEditingItem({ ...editingItem, label: e.target.value })
									}
									className="mt-1"
								/>
							</div>

							<div>
								<Label htmlFor="quantity">Quantity</Label>
								<Input
									id="quantity"
									type="number"
									value={editingItem.quantity}
									onChange={(e) =>
										setEditingItem({
											...editingItem,
											quantity: Number.parseInt(e.target.value) || 0,
										})
									}
									className="mt-1"
								/>
							</div>

							<div>
								<Label htmlFor="unit">Unit</Label>
								<Select
									value={editingItem.unit}
									onValueChange={(value) =>
										setEditingItem({ ...editingItem, unit: value })
									}
								>
									<SelectTrigger id="unit" className="mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ea">Each (ea)</SelectItem>
										<SelectItem value="g">Grams (g)</SelectItem>
										<SelectItem value="kg">Kilograms (kg)</SelectItem>
										<SelectItem value="ml">Milliliters (ml)</SelectItem>
										<SelectItem value="l">Liters (l)</SelectItem>
										<SelectItem value="oz">Ounces (oz)</SelectItem>
										<SelectItem value="lb">Pounds (lb)</SelectItem>
										<SelectItem value="can">Can</SelectItem>
										<SelectItem value="box">Box</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="image-url-vision">Image URL (optional)</Label>
								<Input
									id="image-url-vision"
									type="url"
									placeholder="https://example.com/image.jpg"
									value={editingItem.imageUrl || ""}
									onChange={(e) =>
										setEditingItem({ ...editingItem, imageUrl: e.target.value })
									}
									className="mt-1"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Enter a URL to an image of this product
								</p>
							</div>

							{classificationResult && (
								<div className="bg-muted p-3 rounded-md">
									<p className="text-xs text-muted-foreground mb-2">
										AI Confidence:{" "}
										{Math.round(
											(classificationResult.items[0]?.confidence || 0) * 100,
										)}
										%
									</p>
								</div>
							)}

							<div className="flex gap-3 pt-4">
								<Button
									variant="outline"
									onClick={() => {
										setShowResultSheet(false);
										setUploadedImage(null);
										setEditingItem(null);
										setImgRecResult(null);
									}}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									onClick={handleSaveItem}
									disabled={saveItemMutation.isPending}
									className="flex-1"
								>
									{saveItemMutation.isPending
										? "Saving..."
										: "Save to Inventory"}
								</Button>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}

function BundlesView() {
	const [recipes, setRecipes] = useState<GenerateRecipesResponse | null>(null);
	const [servingsDialogOpen, setServingsDialogOpen] = useState(false);
	const [desiredServings, setDesiredServings] = useState("4");
	const queryClient = useQueryClient();
	const generateRecipes = useRecipeGeneratorMutation();
	const validateBundle = useBundleValidatorMutation();

	// Fetch inventory for recipe generation
	const { data: items = [] } = useQuery({
		queryKey: ["items"],
		queryFn: async () => {
			const orm = ItemORM.getInstance();
			return await orm.getAllItem();
		},
	});

	const { data: intakes = [] } = useQuery({
		queryKey: ["intakes"],
		queryFn: async () => {
			const orm = IntakeORM.getInstance();
			return await orm.getAllIntake();
		},
	});

	// Calculate inventory
	const inventory: InventoryItem[] = items
		.map((item: ItemModel) => {
			const itemIntakes = intakes.filter(
				(intake: IntakeModel) => intake.item_id === item.id,
			);
			const totalQty = itemIntakes.reduce(
				(sum: number, i: IntakeModel) => sum + i.qty,
				0,
			);

			const inventoryItem: InventoryItem = {
				item_id: item.id,
				name: item.name,
				quantity: totalQty,
				unit: item.unit,
			};

			// Only add category if it's not null
			if (item.category !== null && item.category !== undefined) {
				inventoryItem.category = item.category;
			}

			return inventoryItem;
		})
		.filter((item) => item.quantity > 0);

	const handleInitiateGeneration = () => {
		if (inventory.length === 0) {
			toast.error("No inventory items available");
			return;
		}
		// Open dialog to ask for servings
		setServingsDialogOpen(true);
	};

	const handleGenerateRecipes = () => {
		const servingsNum = Number.parseInt(desiredServings);
		if (Number.isNaN(servingsNum) || servingsNum < 1) {
			toast.error("Please enter a valid number of servings (at least 1)");
			return;
		}

		// Validate servings is reasonable (max 1000)
		if (servingsNum > 1000) {
			toast.error(
				"Maximum 1000 servings allowed. Please enter a smaller number.",
			);
			return;
		}

		setServingsDialogOpen(false);

		// STEP 1: First validate with OpenAI
		toast.loading("Checking if inventory is sufficient...", {
			id: "validation-check",
		});

		validateBundle.mutate(
			{
				inventoryItems: inventory,
				totalServings: servingsNum,
				recipeCount: 3,
			},
			{
				onSuccess: (validationResult) => {
					toast.dismiss("validation-check");

					if (!validationResult.canCreate) {
						// Validation failed - show detailed error with larger size
						toast.error(
							<div className="space-y-3 max-w-2xl">
								<p className="font-semibold text-lg">Too many servings!</p>
								<p className="text-base leading-relaxed">
									{validationResult.explanation}
								</p>
								{validationResult.issues.length > 0 && (
									<div>
										<p className="text-sm font-medium mt-2 mb-1.5">Issues:</p>
										<ul className="text-sm list-disc list-inside space-y-1 leading-relaxed">
											{validationResult.issues.map((issue) => (
												<li key={issue}>{issue}</li>
											))}
										</ul>
									</div>
								)}
								{validationResult.suggestedMaxServings && (
									<p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-3">
										💡 Try {validationResult.suggestedMaxServings} total
										servings or fewer
									</p>
								)}
							</div>,
							{ duration: 15000 },
						);
						return;
					}

					// Validation passed - proceed with recipe generation
					toast.success("✓ Inventory check passed! Generating recipes...");

					// STEP 2: Generate recipes
					// Calculate servings per recipe by distributing total servings across 3 recipes
					const recipeCount = 3;
					const servingsPerRecipe = Math.ceil(servingsNum / recipeCount);

					generateRecipes.mutate(
						{
							inventoryItems: inventory,
							recipeCount: recipeCount,
							servingsPerRecipe: servingsPerRecipe,
							// Pass current recipes to exclude them from regeneration
							excludedRecipes: recipes?.recipes || [],
						},
						{
							onSuccess: (data) => {
								// Post-generation validation (client-side sanity check)
								let validationPassed = true;
								const validationErrors: string[] = [];

								for (const recipe of data.recipes) {
									for (const recipeItem of recipe.items) {
										const inventoryItem = inventory.find(
											(inv) => inv.item_id === recipeItem.item_id,
										);
										if (!inventoryItem) {
											validationPassed = false;
											validationErrors.push(
												`${recipeItem.item_id} not found in inventory`,
											);
											continue;
										}

										const { size: unitSize } = parseUnit(
											inventoryItem.unit || "1ea",
										);

										// Check if we have enough based on what the recipe is asking for
										if (isUnitBasedMeasurement(recipeItem.unit)) {
											// Recipe asks for units - compare units directly
											if (inventoryItem.quantity < recipeItem.qty) {
												validationPassed = false;
												validationErrors.push(
													`Not enough ${inventoryItem.name} for "${recipe.title}". Need ${recipeItem.qty} units but only have ${inventoryItem.quantity} units`,
												);
											}
										} else {
											// Recipe asks for weight/volume - compare total amount in grams/ml
											const totalAvailable = inventoryItem.quantity * unitSize;
											if (totalAvailable < recipeItem.qty) {
												validationPassed = false;
												validationErrors.push(
													`Not enough ${inventoryItem.name} for "${recipe.title}". Need ${recipeItem.qty}${recipeItem.unit} but only have ${totalAvailable}${recipeItem.unit}`,
												);
											}
										}
									}
								}

								if (!validationPassed) {
									// Show warning with validation errors (shouldn't happen if OpenAI validation worked)
									toast.error(
										<div className="space-y-3 max-w-2xl">
											<p className="font-semibold text-lg">
												⚠️ Generated recipes exceed available inventory
											</p>
											<ul className="text-sm list-disc list-inside space-y-1 leading-relaxed">
												{validationErrors.slice(0, 5).map((err) => (
													<li key={err}>{err}</li>
												))}
												{validationErrors.length > 5 && (
													<li key="more-issues">
														...and {validationErrors.length - 5} more issues
													</li>
												)}
											</ul>
											<p className="text-sm leading-relaxed">
												This shouldn't happen - the AI may have made an error.
											</p>
										</div>,
										{ duration: 12000 },
									);
									// Still set recipes so user can see what was generated
									setRecipes(data);
								} else {
									setRecipes(data);
									toast.success("Recipes generated successfully!");
								}
							},
							onError: (error) => {
								toast.error(`Failed to generate recipes: ${error.message}`);
							},
						},
					);
				},
				onError: (error) => {
					toast.dismiss("validation-check");
					toast.error(
						<div className="space-y-3 max-w-2xl">
							<p className="font-semibold text-lg">Validation failed</p>
							<p className="text-base leading-relaxed">{error.message}</p>
						</div>,
						{ duration: 10000 },
					);
				},
			},
		);
	};

	// Helper function to parse unit and extract numeric amount
	const parseUnit = (unit: string): { size: number; type: string } => {
		const match = unit.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
		if (match) {
			return { size: Number.parseFloat(match[1]), type: match[2] };
		}
		return { size: 1, type: unit };
	};

	// Helper function to determine if a unit represents discrete units vs weight/volume
	const isUnitBasedMeasurement = (unit: string): boolean => {
		const unitLower = unit.toLowerCase().trim();
		const unitBasedTypes = [
			"ea",
			"each",
			"unit",
			"units",
			"piece",
			"pieces",
			"pc",
			"pcs",
			"item",
			"items",
			"pkg",
			"package",
			"packages",
			"pack",
			"packs",
			"box",
			"boxes",
			"can",
			"cans",
			"bottle",
			"bottles",
			"jar",
			"jars",
			"bag",
			"bags",
		];
		return unitBasedTypes.includes(unitLower);
	};

	// Mutation to deduct ingredients when "Let's Make" is clicked
	const makeRecipe = useMutation({
		mutationFn: async (recipe: RecipeSuggestion) => {
			const intakeOrm = IntakeORM.getInstance();

			// Check if we have enough of each ingredient
			for (const recipeItem of recipe.items) {
				const inventoryItem = inventory.find(
					(inv) => inv.item_id === recipeItem.item_id,
				);
				if (!inventoryItem) {
					throw new Error(
						`Ingredient not found in inventory: ${recipeItem.item_id}`,
					);
				}

				// Parse the inventory unit to get the size per unit
				const { size: unitSize } = parseUnit(inventoryItem.unit || "1ea");

				// Check if we have enough based on what the recipe is asking for
				let hasEnough = false;
				let errorMessage = "";

				if (isUnitBasedMeasurement(recipeItem.unit)) {
					// Recipe asks for units - compare units directly
					hasEnough = inventoryItem.quantity >= recipeItem.qty;
					if (!hasEnough) {
						errorMessage = `Not enough ${inventoryItem.name}. Need ${recipeItem.qty} units but only have ${inventoryItem.quantity} units available.`;
					}
				} else {
					// Recipe asks for weight/volume - compare total amount in grams/ml
					const totalAvailable = inventoryItem.quantity * unitSize;
					hasEnough = totalAvailable >= recipeItem.qty;
					if (!hasEnough) {
						errorMessage = `Not enough ${inventoryItem.name}. Need ${recipeItem.qty}${recipeItem.unit} but only have ${totalAvailable}${recipeItem.unit} available.`;
					}
				}

				if (!hasEnough) {
					throw new Error(errorMessage);
				}
			}

			// If we get here, we have enough of everything - deduct the ingredients
			const intakeRecords: IntakeModel[] = [];
			for (const recipeItem of recipe.items) {
				const inventoryItem = inventory.find(
					(inv) => inv.item_id === recipeItem.item_id,
				);
				if (!inventoryItem) continue;

				const { size: unitSize, type: unitType } = parseUnit(
					inventoryItem.unit || "1ea",
				);

				// Calculate how many units to deduct based on the recipe requirements
				// Two scenarios:
				// 1. Recipe asks for units (ea, unit, piece, etc.): deduct that many units directly
				// 2. Recipe asks for weight/volume (g, kg, ml, l): convert to units
				let unitsToDeduct: number;

				// Check if recipe is asking for units or weight/volume
				if (isUnitBasedMeasurement(recipeItem.unit)) {
					// Recipe asks for units directly - e.g., "1 ea" or "2 units" means that many units
					// Each unit has unitSize grams/ml, so we deduct recipeItem.qty units
					unitsToDeduct = recipeItem.qty;
				} else {
					// Recipe asks for weight/volume - e.g., "200g" means 200 grams
					// Convert from grams/ml to units: qty (in g/ml) / unitSize (g or ml per unit)
					unitsToDeduct = recipeItem.qty / unitSize;
				}

				intakeRecords.push({
					item_id: recipeItem.item_id,
					qty: -unitsToDeduct, // Negative to deduct
					source: `Recipe: ${recipe.title}`,
				} as IntakeModel);
			}

			await intakeOrm.insertIntake(intakeRecords);
		},
		onSuccess: (_, recipe) => {
			queryClient.invalidateQueries({ queryKey: ["intakes"] });
			toast.success(`Started making "${recipe.title}"! Ingredients deducted.`);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<header className="mb-6">
				<h1 className="text-2xl font-bold mb-2">Recipe Bundles</h1>
				<p className="text-muted-foreground text-sm">
					Generate meal packages from available inventory
				</p>
			</header>

			{inventory.length === 0 ? (
				<Card className="p-12 text-center">
					<Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-semibold mb-2">No inventory available</h3>
					<p className="text-sm text-muted-foreground">
						Add items to your inventory first to generate recipes
					</p>
				</Card>
			) : !recipes ? (
				<Card className="p-8 text-center">
					<Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-semibold mb-2">Ready to generate recipes</h3>
					<p className="text-sm text-muted-foreground mb-6">
						{inventory.length} items available for recipe generation
					</p>
					<Button
						onClick={handleInitiateGeneration}
						disabled={generateRecipes.isPending}
						size="lg"
					>
						{generateRecipes.isPending ? "Generating..." : "Generate Recipes"}
					</Button>
				</Card>
			) : (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="font-semibold">Generated Recipes</h2>
						<Button
							onClick={handleInitiateGeneration}
							disabled={generateRecipes.isPending}
							variant="outline"
						>
							Regenerate
						</Button>
					</div>

					{recipes.recipes.map((recipe: RecipeSuggestion) => (
						<Card key={recipe.title}>
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<CardTitle>{recipe.title}</CardTitle>
										<CardDescription className="mt-2">
											{recipe.description}
										</CardDescription>
									</div>
									<Button
										variant="default"
										size="sm"
										onClick={() => makeRecipe.mutate(recipe)}
										disabled={makeRecipe.isPending}
									>
										<Utensils className="h-4 w-4 mr-2" />
										Let's Make
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<p className="text-sm font-medium mb-2">Ingredients:</p>
										<div className="space-y-1">
											{recipe.items.map((item) => {
												const inventoryItem = inventory.find(
													(inv) => inv.item_id === item.item_id,
												);
												return (
													<div
														key={item.item_id}
														className="flex items-center gap-2 text-sm"
													>
														<ChevronRight className="h-3 w-3 text-muted-foreground" />
														<span>
															{inventoryItem?.name || item.item_id}: {item.qty}{" "}
															{item.unit}
														</span>
													</div>
												);
											})}
										</div>
									</div>

									{recipe.servings && (
										<div className="flex gap-4 text-sm text-muted-foreground">
											<span>Servings: {recipe.servings}</span>
											{recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
											{recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Servings Input Dialog */}
			<Dialog open={servingsDialogOpen} onOpenChange={setServingsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>How many servings total?</DialogTitle>
						<DialogDescription>
							Enter the TOTAL number of servings across all 3 recipes (not per
							recipe)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 mt-4">
						<div>
							<Label htmlFor="servings-input">Number of Servings</Label>
							<Input
								id="servings-input"
								type="number"
								min="1"
								max="1000"
								value={desiredServings}
								onChange={(e) => setDesiredServings(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleGenerateRecipes();
									}
								}}
								className="mt-1"
								autoFocus
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Maximum 1000 servings per recipe
							</p>
						</div>
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setServingsDialogOpen(false)}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={handleGenerateRecipes}
								disabled={generateRecipes.isPending}
								className="flex-1"
							>
								{generateRecipes.isPending ? "Generating..." : "Generate"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
