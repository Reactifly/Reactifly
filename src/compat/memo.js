import { Component } from './Component';
import { createElement } from '../vdom/element';
import { is_equal, extend } from '../utils/index';

/**
 * Memoize a component, so that it only updates when the props actually have
 * changed. This was previously known as `React.pure`.
 * 
 * @param   {import('./functionalComponent').FunctionalComponent} c          functional component
 * @param   {(prev: object, next: object) => boolean}             [comparer] Custom equality function (optional)
 * @returns {import('./functionalComponent').FunctionalComponent}
 */
export function memo(ComponentFunc, comparer)
{
    function Memo(props)
    {        
        this.props = props;

        this.ComponentFunc = ComponentFunc;
    }

    Memo.prototype.shouldComponentUpdate = function(nextProps)
    {
        let ref = this.props.ref;

        let updateRef = ref == nextProps.ref;

        if (!updateRef && ref)
        {
            ref.call ? ref(null) : (ref.current = null);
        }

        if (!comparer)
        {
            return !is_equal(this.props, nextProps);
        }

        return !comparer(this.props, nextProps) || !updateRef;
    }

    Memo.prototype.render = function()
    {
        return `<ComponentFunc {...this.props} />`;
    }

    Memo = extend(Component, Memo);

    function Memoed(props)
    {
        return createElement(Memo, props);
    }

    Memoed.displayName = 'Memo(' + (ComponentFunc.displayName || ComponentFunc.name) + ')';
        
    Memoed._forwarded = true;
    
    return Memoed;
}