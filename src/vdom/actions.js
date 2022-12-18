import { replaceNode, appendChild, insertAtIndex, moveToIndex, removeChild, replaceText, setAttribute, removeAttribute } from '../dom/index';

const ACTION_MAP =
{
	replaceNode,
	appendChild,
	removeChild,
	insertAtIndex,
	moveToIndex,
	replaceText,
	setAttribute,
	removeAttribute
};

export function action(name, args)
{ 	
	let callback = ACTION_MAP[name];

	return {
		callback,
		args
	};
}