/*
Copyright 2018-2019 a1pack

https://codesandbox.io/s/mnox05qp8?file=/src/index.js:0-7779

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { is_equal } from '../utils/index';

import { CURR_RENDER, GLOBAL_CONTEXT } from '../internal';

/**
 * Essentially a passthrough to current context provider value.
 * 
 * @param   {object}  context  Context object using 'createContext'
 * @returns {mixed}
 */
export function useContext(context)
{
    if (GLOBAL_CONTEXT.current)
    {
        let provider = GLOBAL_CONTEXT.current;

        if (provider === context[context._id])
        {
            return provider.props ? provider.props.value : context._defaultValue;
        }
    }

    return context._defaultValue;
}

export function useEffect(effect, deps)
{
    const i = CURR_RENDER.current.__internals._hookIndex++;

    if (!CURR_RENDER.current.__internals._hooks[i])
    {
        CURR_RENDER.current.__internals._hooks[i] = effect;
        CURR_RENDER.current.__internals._hookDeps[i] = deps;
        CURR_RENDER.current.__internals._hooksCleanups[i] = effect();
    }
    else
    {
        if (deps && !is_equal(deps, CURR_RENDER.current.__internals._hookDeps[i]))
        {
            if (CURR_RENDER.current.__internals._hooksCleanups[i])
            {
                CURR_RENDER.current.__internals._hooksCleanups[i]();
            }

            CURR_RENDER.current.__internals._hooksCleanups[i] = effect();
        }
    }
}

export function useRef(initialValue)
{
    return useCallback(refHolderFactory(initialValue), []);
}

function refHolderFactory(reference)
{
    function RefHolder(ref)
    {
        reference = ref;
    }

    Object.defineProperty(RefHolder, "current",
    {
        get: () => reference,
        enumerable: true,
        configurable: true
    });

    return RefHolder;
}

export function useLayoutEffect(effect, deps)
{
    const i = CURR_RENDER.current.__internals._hookIndex++;

    const thisHookContext = CURR_RENDER.current;

    useEffect(() =>
    {
        thisHookContext.__internals._layoutEffects[i] = () =>
        {
            thisHookContext.__internals._hooksCleanups[i] = effect();
        };

    }, deps);
}

export function useReducer(reducer, initialState, initialAction)
{
    const i = CURR_RENDER.current.__internals._hookIndex++;

    if (!CURR_RENDER.current.__internals._hooks[i])
    {
        CURR_RENDER.current.__internals._hooks[i] = {
            state: initialAction ? reducer(initialState, initialAction) : initialState
        };
    }

    const thisHookContext = CURR_RENDER.current;

    return [
        CURR_RENDER.current.__internals._hooks[i].state,
        useCallback(action =>
        {
            thisHookContext.__internals._hooks[i].state = reducer(thisHookContext.__internals._hooks[i].state, action);

            thisHookContext.setState();
        }, [])
    ];
}

export function useState(initial)
{
    const i = CURR_RENDER.current.__internals._hookIndex++;

    if (!CURR_RENDER.current.__internals._hooks[i])
    {
        CURR_RENDER.current.__internals._hooks[i] = {
            state: transformState(initial)
        };
    }

    const thisHookContext = CURR_RENDER.current;

    return [

        CURR_RENDER.current.__internals._hooks[i].state,

        useCallback(newState =>
        {
            thisHookContext.__internals._hooks[i].state = transformState(newState, thisHookContext.__internals._hooks[i].state);

            thisHookContext.forceUpdate();

        }, [])
    ];
}

function useCallback(cb, deps)
{
    return useMemo(() => cb, deps);
}

function useMemo(factory, deps)
{
    const i = CURR_RENDER.current.__internals._hookIndex++;

    if (
        !CURR_RENDER.current.__internals._hooks[i] ||
        !deps ||
        !is_equal(deps, CURR_RENDER.current.__internals._hookDeps[i])
    )
    {
        CURR_RENDER.current.__internals._hooks[i] = factory();
        CURR_RENDER.current.__internals._hookDeps[i] = deps;
    }

    return CURR_RENDER.current.__internals._hooks[i];
}

// end public api

function transformState(state, prevState)
{
    if (typeof state === "function")
    {
        return state(prevState);
    }

    return state;
}

// end _HOOKS