import { CategoryCard } from "./category-card";
import { RevealItem, Stagger } from "./reveal";
import { type StoreCategory } from "../types";

export function CategoryGrid({ categories }: { categories: StoreCategory[] }) {
  return (
    <Stagger
      gap={0.07}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
    >
      {categories.map((category) => (
        <RevealItem key={category.id}>
          <CategoryCard category={category} />
        </RevealItem>
      ))}
    </Stagger>
  );
}
