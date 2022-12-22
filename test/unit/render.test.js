import Reactifly, { render, jsx, createElement } from '../../src/index';
import { setupScratch, teardown, serializeHtml } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';
import { expect } from 'chai';

const isIE11 = /Trident\//.test(navigator.userAgent);

describe('render()', () =>
{
	let scratch;
	let resetAppendChild;
	let resetInsertBefore;
	let resetRemoveChild;
	let resetRemove;

	beforeEach(() =>
	{
		scratch = setupScratch();
	});

	afterEach(() =>
	{
		teardown(scratch);
	});

	before(() =>
	{
		resetAppendChild  = logCall(Element.prototype, 'appendChild');
		resetInsertBefore = logCall(Element.prototype, 'insertBefore');
		resetRemoveChild  = logCall(Element.prototype, 'removeChild');
		resetRemove       = logCall(Element.prototype, 'remove');
	});

	after(() =>
	{
		resetAppendChild();
		resetInsertBefore();
		resetRemoveChild();
		resetRemove();
	});

	it('should rerender when value from "" to 0', () =>
	{
		render('', scratch);
		expect(scratch.innerHTML).to.equal('');

		render(0, scratch);
		expect(scratch.innerHTML).to.equal('0');
	});

	it('should render an empty text node given an empty string', () =>
	{
		render('', scratch);
		let c = scratch.childNodes;
		expect(c).to.have.length(1);
		expect(c[0].data).to.equal('');
		expect(c[0].nodeName).to.equal('#text');
	});

	it('should allow node type change with content', () =>
	{
		render(`<span>Bad</span>`, scratch);
		render(`<div>Good</div>`, scratch);
		expect(scratch.innerHTML).to.eql(`<div>Good</div>`);
	});

	it('should create empty nodes (<* />)', () =>
	{
		render(`<div />`, scratch);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName).to.equal('DIV');

		scratch.parentNode.removeChild(scratch);
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);

		render(`<span />`, scratch);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName).to.equal('SPAN');
	});

	it('should not throw error in IE11 with type date', () =>
	{
		expect(() => render(`<input type="date" />`, scratch)).to.not.throw();
	});

	it('should support custom tag names', () => 
	{
		render(`<foo />`, scratch);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.firstChild).to.have.property('nodeName', 'FOO');

		scratch.parentNode.removeChild(scratch);
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);

		render(`<x-bar />`, scratch);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.firstChild).to.have.property('nodeName', 'X-BAR');
	});

	it('should support the form attribute', () => 
	{
		render(
			`<div>
				<form id="myform" />
				<button form="myform">test</button>
				<input form="myform" />
			</div>`,
			scratch
		);
		const div = scratch.childNodes[0];
		const form = div.childNodes[0];
		const button = div.childNodes[1];
		const input = div.childNodes[2];

		// IE11 doesn't support the form attribute
		if (!isIE11)
		{
			expect(button).to.have.property('form', form);
			expect(input).to.have.property('form', form);
		}
	});

	it('should allow VNode reuse', () =>
	{
		let reused = createElement(`<div class="reuse">Hello World!</div>`);

		render(
			`<div>
				{reused}
				<hr />
				{reused}
			</div>`,
			scratch, {reused: reused}
		);
		
		console.log(serializeHtml(scratch));
	});

});

/*const List = function(props)
{
    let vars = 
    {
        props : props
    };

    return Reactifly.jsx(`
        <ol>
            {props.values.map(value => (
                <li key={value}>{value}</li>
            ))}
        </ol>
    `, vars);
};

let values = ['a', 'b'];

Reactifly.render('<List values={values} />', document.body, {List: List, values : values});*/