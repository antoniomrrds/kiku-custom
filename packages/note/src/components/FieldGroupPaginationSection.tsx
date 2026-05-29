import { lazy } from "solid-js";
import { useFieldGroupContext } from "./shared/FieldGroupContext";

// oxfmt-ignore
const Lazy = {
  FieldGroupPagination: lazy(async () => ({ default: (await import("./_kiku_lazy")).FieldGroupPagination, })),
};

export function FieldGroupPaginationSection() {
  const { $group } = useFieldGroupContext();

  return (
    <div
      class="flex justify-between text-base-content-soft items-center gap-2 animate-fade-in h-5 sm:h-8"
      classList={{
        hidden: $group.ids.length <= 1,
      }}
    >
      <Lazy.FieldGroupPagination />
    </div>
  );
}
