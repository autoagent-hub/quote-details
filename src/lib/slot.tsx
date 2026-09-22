import * as React from "react";

const SLOTTABLE_IDENTIFIER = Symbol.for("radix.slottable");

interface SlottableProps {
  child?: (child: React.ReactNode) => React.ReactNode;
  children: React.ReactNode | ((child: React.ReactNode) => React.ReactNode);
}

function isSlottable(child: unknown): child is React.ReactElement<SlottableProps> {
  return (
    React.isValidElement(child) &&
    typeof child.type === "function" &&
    "__radixId" in child.type &&
    (child.type as { __radixId?: symbol }).__radixId === SLOTTABLE_IDENTIFIER
  );
}

function createSlottable(ownerName: string) {
  const SlottableComponent: React.FC<SlottableProps> = (props) => {
    if ("child" in props && typeof props.child === "function") {
      return <>{props.children}</>;
    }
    return <>{props.children}</>;
  };
  SlottableComponent.displayName = `${ownerName}.Slottable`;
  (SlottableComponent as unknown as { __radixId: symbol }).__radixId = SLOTTABLE_IDENTIFIER;
  return SlottableComponent;
}

const Slottable = createSlottable("Slottable");

function getSlottableElement(
  slottable: React.ReactElement<SlottableProps>,
  child: React.ReactNode,
): React.ReactElement | null {
  if ("child" in slottable.props && typeof slottable.props.child === "function") {
    const childNode = slottable.props.child;
    if (!React.isValidElement(childNode)) return null;
    return childNode;
  }
  return React.isValidElement(child) ? child : null;
}

function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const overrideProps: Record<string, unknown> = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];

    if (/^on[A-Z]/.test(propName)) {
      if (typeof slotPropValue === "function" && typeof childPropValue === "function") {
        overrideProps[propName] = (...args: unknown[]) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = {
        ...((slotPropValue as Record<string, unknown>) || {}),
        ...((childPropValue as Record<string, unknown>) || {}),
      };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }

  return { ...slotProps, ...overrideProps };
}

function getElementRef(element: React.ReactElement): React.Ref<unknown> | undefined {
  const props = element.props as Record<string, unknown>;
  let getter = Object.getOwnPropertyDescriptor(props, "ref")?.get;
  let mayWarn =
    getter &&
    "isReactWarning" in getter &&
    Boolean((getter as { isReactWarning?: boolean }).isReactWarning);
  if (mayWarn) return (element as unknown as { ref?: React.Ref<unknown> }).ref;
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn =
    getter &&
    "isReactWarning" in getter &&
    Boolean((getter as { isReactWarning?: boolean }).isReactWarning);
  if (mayWarn) return props.ref as React.Ref<unknown> | undefined;
  return (props.ref || (element as unknown as { ref?: React.Ref<unknown> }).ref) as
    React.Ref<unknown> | undefined;
}

function composeRefs(...refs: (React.Ref<unknown> | undefined)[]) {
  return (node: unknown) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object" && "current" in ref) {
        (ref as React.MutableRefObject<unknown>).current = node;
      }
    }
  };
}

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

function createSlot(ownerName: string) {
  const SlotComponent = React.forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
    const { children, ...slotProps } = props;

    let slottableElement: React.ReactElement | null = null;
    let hasSlottable = false;
    const newChildren: React.ReactNode[] = [];

    React.Children.forEach(children, (maybeSlottable) => {
      if (isSlottable(maybeSlottable)) {
        hasSlottable = true;
        const slottable = maybeSlottable;
        const child = "child" in slottable.props ? slottable.props.child : slottable.props.children;
        slottableElement = getSlottableElement(slottable, child);
        if (slottableElement) {
          const innerProps = slottableElement.props as { children?: React.ReactNode };
          newChildren.push(innerProps?.children);
        }
      } else {
        newChildren.push(maybeSlottable);
      }
    });

    if (slottableElement) {
      slottableElement = React.cloneElement(slottableElement, undefined, ...newChildren);
    } else if (
      !hasSlottable &&
      React.Children.count(children) === 1 &&
      React.isValidElement(children)
    ) {
      slottableElement = children;
    }

    if (!slottableElement) {
      if (children || children === 0) {
        return <>{children}</>;
      }
      return null;
    }

    const slottableElementRef = getElementRef(slottableElement);
    const mergedProps = mergeProps(
      slotProps as Record<string, unknown>,
      (slottableElement.props as Record<string, unknown>) ?? {},
    );

    if (slottableElement.type !== React.Fragment) {
      if (forwardedRef && slottableElementRef) {
        mergedProps.ref = composeRefs(forwardedRef, slottableElementRef);
      } else if (forwardedRef) {
        mergedProps.ref = forwardedRef;
      } else if (slottableElementRef) {
        mergedProps.ref = slottableElementRef;
      }
    }

    return React.cloneElement(slottableElement, mergedProps);
  });

  SlotComponent.displayName = `${ownerName}.Slot`;
  return SlotComponent;
}

const Slot = createSlot("Slot");

export { Slot as Root, Slot, Slottable, createSlot, createSlottable };
