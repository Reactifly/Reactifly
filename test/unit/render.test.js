import * as reactifly from '../../src/index';
import { setupScratch, teardown, serializeHtml } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';
import { expect } from 'chai';

const isIE11 = /Trident\//.test(navigator.userAgent);

describe('render()', () =>
{
	let scratch;
	let root;
	let instance;

	beforeEach(() =>
	{
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);
	});

	afterEach(() =>
	{
		teardown(scratch);
	});

	it('should render an empty text node given an empty string', () =>
	{
		root.render('');
		let c = scratch.childNodes;
		expect(c).to.have.length(1);
		expect(c[0].data).to.equal('');
		expect(c[0].nodeName).to.equal('#text');
	});

	it('should re-render when value from "" to 0', () =>
	{
		root.render('');
		expect(scratch.innerHTML).to.equal('');

		root.render(0);
		expect(scratch.innerHTML).to.equal('0');

		root.render('');
		expect(scratch.innerHTML).to.equal('');
	});

	it('should allow node type change with content', () =>
	{
		root.render(`<span>Bad</span>`);
		expect(scratch.innerHTML).to.eql(`<span>Bad</span>`);

		root.render(`<div>Good</div>`);
		expect(scratch.innerHTML).to.eql(`<div>Good</div>`);
	});

	it('should create empty nodes (<* />)', () =>
	{
		root.render(`<div />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('DIV');

		teardown(scratch);
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);

		root.render(`<span />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('SPAN');
	});

	it('should not throw error in IE11 with type date', () =>
	{
		expect(() => root.render(`<input type="date" />`)).to.not.throw();
	});

	it('should support custom tag names', () => 
	{
		root.render(`<foo />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('FOO');

		teardown(scratch);
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);

		root.render(`<x-bar />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('X-BAR');
	});

	it('should support the form attribute', () => 
	{
		root.render(
			`<div>
				<form id="myform" />
				<button form="myform">test</button>
				<input form="myform" />
			</div>`
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
		let reused = reactifly.jsx(`<div class="reuse">Hello World!</div>`);

		root.render(
			`<div>
				{reused}
				<hr />
				{reused}
			</div>`,
			{ reused: reused }
		);
		
		expect(serializeHtml(scratch)).to.eql(
			`<div><div class="reuse">Hello World!</div><hr><div class="reuse">Hello World!</div></div>`
		);

		root.render(
			`<div>
				<hr />
				{reused}
			</div>`,
			{ reused: reused }
		);

		expect(serializeHtml(scratch)).to.eql(
			`<div><hr><div class="reuse">Hello World!</div></div>`
		);
	});


});