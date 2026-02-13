import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type FilterDefaults = {
  query: string;
  year: string;
  institution: string;
  sort: string;
};

type FilterKey = keyof FilterDefaults;

type FilterState = FilterDefaults;

type FilterParamMap = Record<FilterKey, string>;

const paramMap: FilterParamMap = {
  query: "q",
  year: "year",
  institution: "institution",
  sort: "sort",
};

const defaultValues: FilterDefaults = {
  query: "",
  year: "all",
  institution: "all",
  sort: "recent",
};

export function useFilters(overrides?: Partial<FilterDefaults>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = { ...defaultValues, ...overrides };

  const filters = useMemo<FilterState>(() => {
    return {
      query: searchParams.get(paramMap.query) ?? defaults.query,
      year: searchParams.get(paramMap.year) ?? defaults.year,
      institution: searchParams.get(paramMap.institution) ?? defaults.institution,
      sort: searchParams.get(paramMap.sort) ?? defaults.sort,
    };
  }, [defaults.institution, defaults.query, defaults.sort, defaults.year, searchParams]);

  const setFilter = (key: FilterKey, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    const paramKey = paramMap[key];
    const defaultValue = defaults[key];

    if (!value || value === defaultValue) {
      nextParams.delete(paramKey);
    } else {
      nextParams.set(paramKey, value);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const setFilters = (nextValues: Partial<FilterState>) => {
    const nextParams = new URLSearchParams(searchParams);

    (Object.keys(paramMap) as FilterKey[]).forEach((key) => {
      if (key in nextValues) {
        const paramKey = paramMap[key];
        const value = nextValues[key] ?? "";
        const defaultValue = defaults[key];

        if (!value || value === defaultValue) {
          nextParams.delete(paramKey);
        } else {
          nextParams.set(paramKey, value);
        }
      }
    });

    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    Object.values(paramMap).forEach((paramKey) => nextParams.delete(paramKey));
    setSearchParams(nextParams, { replace: true });
  };

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
  };
}
