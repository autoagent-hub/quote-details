import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  value: string[];
  toggleItem: (itemValue: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  value: [],
  toggleItem: () => {},
});

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" });

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      collapsible = true,
      value: controlledValue,
      defaultValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const toArray = (v?: string | string[]): string[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string") return [v];
      return [];
    };

    const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
      toArray(defaultValue),
    );
    const isControlled = controlledValue !== undefined;
    const currentValues = isControlled ? toArray(controlledValue) : uncontrolledValue;

    const toggleItem = React.useCallback(
      (itemValue: string) => {
        let nextValues: string[];
        if (type === "single") {
          const isOpen = currentValues.includes(itemValue);
          if (isOpen && collapsible) {
            nextValues = [];
          } else {
            nextValues = [itemValue];
          }
        } else {
          const isOpen = currentValues.includes(itemValue);
          if (isOpen) {
            nextValues = currentValues.filter((v) => v !== itemValue);
          } else {
            nextValues = [...currentValues, itemValue];
          }
        }

        if (!isControlled) {
          setUncontrolledValue(nextValues);
        }

        if (onValueChange) {
          if (type === "single") {
            onValueChange(nextValues[0] || "");
          } else {
            onValueChange(nextValues);
          }
        }
      },
      [type, collapsible, currentValues, isControlled, onValueChange],
    );

    return (
      <AccordionContext.Provider value={{ value: currentValues, toggleItem }}>
        <div ref={ref} className={cn("space-y-1", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={{ value }}>
      <div ref={ref} className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  ),
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { value: activeValues, toggleItem } = React.useContext(AccordionContext);
  const { value: itemValue } = React.useContext(AccordionItemContext);
  const isOpen = activeValues.includes(itemValue);

  return (
    <div className="flex">
      <button
        ref={ref}
        type="button"
        data-state={isOpen ? "open" : "closed"}
        aria-expanded={isOpen}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) {
            toggleItem(itemValue);
          }
        }}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    </div>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { value: activeValues } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);
    const isOpen = activeValues.includes(itemValue);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className="overflow-hidden text-sm animate-in fade-in-0 duration-200"
        {...props}
      >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
