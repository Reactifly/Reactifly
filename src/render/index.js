import { Root } from './root';

/**
 * Create root tree
 *  
 * @param   {HTMLElement}         htmlRootEl  Root html element
 * @param   {object | undefined}  options     Options (optional)
 * @returns {import('./root').Root}
 */
export function createRoot(htmlRootEl, options)
{
    return new Root(htmlRootEl, options);
}

/**
 * Render a component to an HTMLElement
 *  
 * @param {function | string}   component   Component to render
 * @param {HTMLElement}         htmlRootEl  Root html element
 * @param {object | undefined}  bindings    Root props and or decencies for JSX (optional)
 */
export function render(component, htmlRootEl, bindings)
{
    let root = createRoot(htmlRootEl);

    root.render(component, bindings);
}