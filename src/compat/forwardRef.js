import { cloneDeep } from '../utils/index';

/**
 * 
 * Pass ref down to a child. This is mainly used in libraries with HOCs that
 * wrap components. Using `forwardRef` there is an easy way to get a reference
 * of the wrapped component instead of one of the wrapper itself.
 * 
 * @param {import('./index').ForwardFn} fn
 * @returns {import('./internal').FunctionComponent}
 */
export function forwardRef(fn)
{
	function Forwarded(props)
	{
		console.log(props);
		
		let clone = cloneDeep(props);

		delete clone.ref;
		
		return fn(clone, props.ref || null);
	}

	Forwarded.displayName = 'ForwardRef(' + (fn.displayName || fn.name) + ')';
	
	return Forwarded;
}

export function createRef()
{
	return { current: null };
}
