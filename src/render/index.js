import { Root } from './root';

export function createRoot(htmlRootEl, options)
{
    return new Root(htmlRootEl, options);
}

export function render(component, parent, rootProps)
{       
    let root = createRoot(parent);

    root.render(component, rootProps);
}