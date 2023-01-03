/*
Copyright 2018-2019 a1pack

https://codesandbox.io/s/mnox05qp8?file=/src/index.js:0-7779

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { is_equal } from '../utils/index';
import { RENDER_QUEUE } from '../internal';


/**
 * @param {import('./internal').PreactContext} context
 */
export function useContext(context)
{
    const provider = currentComponent.context[context._id];
    // We could skip this call here, but than we'd not call
    // `options._hook`. We need to do that in order to make
    // the devtools aware of this hook.
    /** @type {import('./internal').ContextHookState} */
    const state = getHookState(currentIndex++, 9);
    // The devtools needs access to the context object to
    // be able to pull of the default value when no provider
    // is present in the tree.
    state._context = context;
    
    if (!provider) return context._defaultValue;
    // This is probably not safe to convert to "!"
    if (state._value == null) {
        state._value = true;
        provider.sub(currentComponent);
    }
    return provider.props.value;
}



export function useEffect(effect, deps)
{
    const i = RENDER_QUEUE.current.__internals._hookIndex++;

    if (!RENDER_QUEUE.current.__internals._hooks[i])
    {
        RENDER_QUEUE.current.__internals._hooks[i] = effect;
        RENDER_QUEUE.current.__internals._hookDeps[i] = deps;
        RENDER_QUEUE.current.__internals._hooksCleanups[i] = effect();
    }
    else
    {
        if (deps && !is_equal(deps, RENDER_QUEUE.current.__internals._hookDeps[i]))
        {
            if (RENDER_QUEUE.current.__internals._hooksCleanups[i])
            {
                RENDER_QUEUE.current.__internals._hooksCleanups[i]();
            }

            RENDER_QUEUE.current.__internals._hooksCleanups[i] = effect();
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
    const i = RENDER_QUEUE.current.__internals._hookIndex++;

    const thisHookContext = RENDER_QUEUE.current;

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
    const i = RENDER_QUEUE.current.__internals._hookIndex++;

    if (!RENDER_QUEUE.current.__internals._hooks[i])
    {
        RENDER_QUEUE.current.__internals._hooks[i] = {
            state: initialAction ? reducer(initialState, initialAction) : initialState
        };
    }

    const thisHookContext = RENDER_QUEUE.current;

    return [
        RENDER_QUEUE.current.__internals._hooks[i].state,
        useCallback(action =>
        {
            thisHookContext.__internals._hooks[i].state = reducer(thisHookContext.__internals._hooks[i].state, action);

            thisHookContext.setState();
        }, [])
    ];
}

export function useState(initial)
{
    const i = RENDER_QUEUE.current.__internals._hookIndex++;

    if (!RENDER_QUEUE.current.__internals._hooks[i])
    {
        RENDER_QUEUE.current.__internals._hooks[i] = {
            state: transformState(initial)
        };
    }

    const thisHookContext = RENDER_QUEUE.current;

    return [

        RENDER_QUEUE.current.__internals._hooks[i].state,

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
    const i = RENDER_QUEUE.current.__internals._hookIndex++;

    if (
        !RENDER_QUEUE.current.__internals._hooks[i] ||
        !deps ||
        !is_equal(deps, RENDER_QUEUE.current.__internals._hookDeps[i])
    )
    {
        RENDER_QUEUE.current.__internals._hooks[i] = factory();
        RENDER_QUEUE.current.__internals._hookDeps[i] = deps;
    }

    return RENDER_QUEUE.current.__internals._hooks[i];
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