import { lazy } from "solid-js";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";

// oxfmt-ignore
const Lazy = {
  FieldGroupPagination: lazy(async () => ({ default: (await import("#/src/lazy")).FieldGroupPagination, })),
};

export function FieldGroupPaginationSection() {
  const { $group } = useFieldGroupContext();

  return (
    <div
      class="flex justify-between text-base-content-soft items-center gap-2 animate-fade-in h-7 sm:h-8 mt-2 sm:mt-4"
      classList={{
        hidden: $group().ids.length <= 1,
      }}
    >
      <Lazy.FieldGroupPagination />
    </div>
  );
}
