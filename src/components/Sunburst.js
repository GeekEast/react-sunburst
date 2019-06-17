import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import HashMap from 'hashmap';
import { select, selectAll } from 'd3-selection';
import '../styles/Sunburst.css';

/**
 * data: the source data for sunburst
 * radius: the radius of the sunburst
 * b: (w,h,s,t) the width, height, space and tail of the breadcrumb
 * rootStatus: the color for the root element
 * colors: (ahead, behind, complete, incomplete) the color or different status
 * li: (w,h,s,r) the width, height, space and radius of the rounded legend rect
 * keyId: the unique id the Sunburst, optional
 */
class Sunburst extends React.Component {
	componentDidMount = () => {
		// after loading the page, render the sunburst
		this.renderSunburst(this.props);
	};

	componentWillReceiveProps = (nextProps) => {
		// save time operation
		if (!_.isEqual(this.props, nextProps)) {
			// render
			this.renderSunburst(nextProps);
		}
	};

	setTreeStatus = (kind, json) => {
		// assume json[i] has task_status attr.
		const hashMap = new HashMap();

		// stage one: build the hashMap
		for (let i = 0; i < json.length; i++) {
			const sub_status = kind === 'phase' ? json[i]['task_status'] : json[i]['phase_status'];
			const key = kind === 'phase' ? json[i]['project_name'] + json[i]['phase_name'] : json[i]['project_name'];

			if (hashMap.has(key)) {
				const values = hashMap.get(key);
				values.push(sub_status);
				hashMap.set(key, values);
			} else {
				const preparedValues = [];
				preparedValues.push(sub_status);
				hashMap.set(key, preparedValues);
			}
		}

		// stage two: get the parent status
		hashMap.forEach((v, k) => {
			let status = 'ahead';
			for (let j = 0; j < v.length; j++) {
				if (v[j] === 'behind') {
					status = 'behind';
					break;
				}
			}
			hashMap.set(k, status);
		});

		// stage three: set the status of the parent
		for (let m = 0; m < json.length; m++) {
			const key = kind === 'phase' ? json[m]['project_name'] + json[m]['phase_name'] : json[m]['project_name'];
			const parent_status = hashMap.get(key);
			const attr_name = kind === 'phase' ? 'phase_status' : 'project_status';
			json[m][attr_name] = parent_status;
		}

		return json;
	};

	setTaskStatus = (json) => {
		// set the status of task
		for (let i = 0; i < json.length; i++) {
			const task_projected_due_date = json[i]['task_projected_due_date'];
			const task_fixed_due_date = json[i]['task_fixed_due_date'];

			const task_due_date = task_fixed_due_date ? task_fixed_due_date : task_projected_due_date;
			const task_closed_date = json[i]['task_closed_date'];
			const task_behind_staus =
				!task_closed_date && task_due_date && new Date().getTime() > new Date(task_due_date).getTime()
					? true
					: false;
			let task_status;
			if (task_behind_staus) {
				task_status = 'behind';
			} else {
				task_status = 'ahead';
			}
			json[i]['task_status'] = task_status;
		}
		return json;
	};

	setConditionStatus = (json) => {
		for (let i = 0; i < json.length; i++) {
			const complete = json[i]['condition_completed_date'];
			const dismiss = json[i]['dismissed_at_dimissed_date'];
			let condition_status;

			if (dismiss || complete) {
				condition_status = 'complete';
			} else {
				condition_status = 'incomplete';
			}
			json[i]['condition_status'] = condition_status;
		}
		return json;
	};

	setStatus = (json) => {
		// set condition status
		json = this.setConditionStatus(json);
		json = this.setTaskStatus(json);
		json = this.setTreeStatus('phase', json);
		json = this.setTreeStatus('project', json);
		// // clear the data
		return this.slimJosn(json);
	};

	slimJosn = (json) => {
		const arr = [
			'project_name',
			'phase_name',
			'task_name',
			'condition_name',
			'condition_status',
			'task_status',
			'phase_status',
			'project_status'
		];
		const slim = [];
		for (let i = 0; i < json.length; i++) {
			const line = json[i];
			const temp = {};
			for (let j = 0; j < arr.length; j++) {
				temp[arr[j]] = line[arr[j]];
			}
			slim.push(temp);
		}
		return slim;
	};

	/**
	 * 
	 * @param {*} data: raw data
	 * [
	 *  {
	 *      "property_name": "string",
	 *      "project_name": "string",
	 *      "phase_name": "string",
	 *      "condition_name": "string",
	 *      "condition_closed_date": "string",
	 *      "condition_completed_date": "string",
	 *      "dismissed_at_dimissed_date": "string",
	 *      "task_closed_date": "string",
	 *      "task_projected_due_date": "string",
	 *      "task_fixed_due_date": "string",
	 *      "project_closed_at_date": "string"
	 *  }
	 * ]
	 * @param {*} rootStatus : the color for the root node
	 * 
	 */
	buildHierarchy = (data, rootStatus, colors) => {
		// data is in list of json format
		const json = this.setStatus(data);
		const root = { name: '', children: [], status: rootStatus };
		for (let i = 0; i < json.length; i++) {
			// set size to 1 for each condition
			const size = 1;
			const parts = [ 'project_name', 'phase_name', 'task_name', 'condition_name' ];
			var currentNode = root;

			for (let j = 0; j < parts.length; j++) {
				const children = currentNode['children'];
				const part = parts[j];
				const nodeName = json[i][part];

				let status;
				switch (part) {
					case 'project_name':
						status = json[i]['project_status'] === 'ahead' ? colors.ahead : colors.behind;
						break;
					case 'phase_name':
						status = json[i]['phase_status'] === 'ahead' ? colors.ahead : colors.behind;
						break;
					case 'task_name':
						status = json[i]['task_status'] === 'ahead' ? colors.ahead : colors.behind;
						break;
					default:
						status = json[i]['condition_status'] === 'complete' ? colors.complete : colors.incomplete;
				}

				var childNode;

				// if not the leaf node
				if (part !== 'condition_name') {
					let foundChild = false;
					// iterate the children
					for (let k = 0; k < children.length; k++) {
						if (children[k]['name'] === nodeName) {
							childNode = children[k];
							foundChild = true;
							break;
						}
					}

					if (!foundChild) {
						childNode = {
							name: nodeName,
							status: status,
							children: []
						};
						children.push(childNode);
					}
					currentNode = childNode;
				} else {
					childNode = {
						name: nodeName,
						status: status,
						size: size
					};
					children.push(childNode);
				}
			}
		}
		return root;
	};
	initializeBreadcrumbTrail = () => {
		// Add the svg area.
		const trail = d3
			.select(this.refs.sequence)
			.append('svg:svg')
			.attr('width', 1500)
			.attr('height', 50)
			.attr('id', 'trail');

		// if you want to add text in the end of the breadcrumb
		trail.append('svg:text').attr('id', 'endlabel').attr('ref', 'endlabel').style('fill', '#000');
	};

	drawLegend = (colors, li) => {
		const legend = d3
			.select(this.refs.legend)
			.append('svg:svg')
			.attr('width', li.w)
			.attr('height', d3.keys(colors).length * (li.h + li.s));

		const g = legend
			.selectAll('g')
			.data(d3.entries(colors))
			.enter()
			.append('svg:g')
			.attr('transform', function(d, i) {
				return 'translate(0,' + i * (li.h + li.s) + ')';
			});

		g
			.append('svg:rect')
			.attr('rx', li.r)
			.attr('ry', li.r)
			.attr('width', li.w)
			.attr('height', li.h)
			.style('fill', function(d) {
				return d.value;
			});

		g
			.append('svg:text')
			.attr('x', li.w / 2)
			.attr('y', li.h / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'middle')
			.text(function(d) {
				return d.key;
			});
	};

	onClick = (d, svg, x, y, radius, arc) => {
		svg
			.transition()
			.duration(20)
			.tween('scale', function() {
				const xd = d3.interpolate(x.domain(), [ d.x0, d.x1 ]),
					yd = d3.interpolate(y.domain(), [ d.y0, 1 ]),
					yr = d3.interpolate(y.range(), [ d.y0 ? 20 : 0, radius ]);
				return function(t) {
					x.domain(xd(t));
					y.domain(yd(t)).range(yr(t));
				};
			})
			.selectAll('path')
			.attrTween('d', function(d) {
				return function() {
					return arc(d);
				};
			});
	};

	// Generate a string that describes the points of a breadcrumb polygon.
	breadcrumbPoints = (d, i) => {
		const { b } = this.props;
		const points = [];
		points.push('0,0');
		points.push(b.w + ',0');
		points.push(b.w + b.t + ',' + b.h / 2);
		points.push(b.w + ',' + b.h);
		points.push('0,' + b.h);
		if (i > 0) {
			// Leftmost breadcrumb; don't include 6th vertex.
			points.push(b.t + ',' + b.h / 2);
		}
		return points.join(' ');
	};

	updateBreadcrumbs = (nodeArray) => {
		const { b } = this.props;

		// Data join; key function combines name and depth (= position in sequence).rad
		const trail = d3.select('#trail').selectAll('g').data(nodeArray, function(d) {
			return d.data.name + d.depth;
		});

		// Remove exiting nodes.
		trail.exit().remove();

		// Add breadcrumb and label for entering nodes.
		const entering = trail.enter().append('svg:g');

		// determine the color of breadcrumb
		entering.append('svg:polygon').attr('points', this.breadcrumbPoints).style('fill', function(d) {
			return d.data.status;
		});

		// the text above the breakcrumb
		entering
			.append('svg:text')
			.attr('x', (b.w + b.t) / 2)
			.attr('y', b.h / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'middle')
			.text(function(d) {
				return d.data.name;
			});

		// Merge enter and update selections; set position for all nodes.
		entering.merge(trail).attr('transform', function(d, i) {
			return 'translate(' + i * (b.w + b.s) + ', 0)';
		});

		// Make the breadcrumb trail visible, if it's hidden.
		d3.select('#trail').style('visibility', '');
	};

	mouseOver = (d, svg) => {
		select(this.refs.detail).text(d.data.name);
		select(this.refs.explanation).transition().duration(1000).style('visibility', '').style('opacity', 1);

		const sequenceArray = d.ancestors().reverse();
		// remove the first element
		sequenceArray.shift(); // remove root node from the array
		this.updateBreadcrumbs(sequenceArray);

		// Fade all the segments.
		d3.selectAll('path').style('opacity', 0.8);

		// Then highlight only those that are an ancestor of the current segment.
		svg
			.selectAll('path')
			.filter(function(node) {
				return sequenceArray.indexOf(node) >= 0;
			})
			.style('opacity', 1);
	};

	mouseLeave = (d, svg, that) => {
		// Hide the breadcrumb trail
		d3.select('#trail').style('visibility', 'hidden');

		// Deactivate all segments during transition.
		d3.selectAll('path').on('mouseover', null);

		select(this.refs.explanation).transition().duration(200).style('visibility', 'hidden');

		// Transition each segment to full opacity and then reactivate it.
		selectAll('path').transition().duration(200).style('opacity', 1).on('end', function() {
			select(this).on('mouseover', (d) => that.mouseOver(d, svg));
		});
	};

	update = (svg, root, partition, arc, x, y, radius, colors, that, li) => {
		this.drawLegend(colors, li);
		this.initializeBreadcrumbTrail();
		const nodes = partition(root).descendants();
		svg
			.selectAll('path')
			.data(nodes)
			.enter()
			.append('svg:path')
			.attr('d', arc)
			.attr('fill-rule', 'evenodd')
			.attr('fill', (d) => d.data.status)
			.attr('stroke', '#fff')
			.attr('stroke-width', '0.3')
			.style('opacity', 1)
			.on('click', (d) => this.onClick(d, svg, x, y, radius, arc))
			.on('mouseover', (d) => this.mouseOver(d, svg));

		// Add the mouseleave handler to the bounding circle.
		d3.select(this.refs.container).on('mouseleave', (d) => this.mouseLeave(d, svg, that));
	};

	renderSunburst = (props) => {
		const { data, radius, rootStatus, colors, li } = props;
		const that = this;
		if (data) {
			const json = this.buildHierarchy(data, rootStatus, colors);
			const x = d3.scaleLinear().range([ 0, 2 * Math.PI ]);
			const y = d3.scaleSqrt().range([ 0, radius ]);
			const svg = select(this.refs.container).attr('transform', `translate(${radius},${radius})`);
			const partition = d3.partition().size([ 1, 1 ]);
			const arc = d3
				.arc()
				.startAngle((d) => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
				.endAngle((d) => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
				.innerRadius((d) => Math.max(0, y(d.y0)))
				.outerRadius((d) => Math.max(0, y(d.y1)));
			const root = d3.hierarchy(json).sum((d) => d.size).sort((a, b) => b.value - a.value);
			this.update(svg, root, partition, arc, x, y, radius, colors, that, li);
		}
	};

	render() {
		return (
			<React.Fragment>
				<div id={this.props.keyId ? this.props.keyId : null} className="sunburst">
					<div className="sunburst-main">
						<div ref="sequence" className="sunburst-main-sequence" />
						<div className="sunburst-main-chart">
							<svg className="sunburst-main-chart-svg">
								<g ref="container" />
							</svg>
							<div className="sunburst-main-chart-sidebar">
								<div ref="legend" className="sunburst-main-chart-sidebar-legend" />
							</div>
							<div ref="explanation" className="sunburst-main-chart-explanation">
								<span ref="detail" className="sunburst-main-chart-explanation-detail" />
								<br />
							</div>
						</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

Sunburst.defaultProps = {
	rootStatus: '#F5F7FA',
	colors: {
		ahead: '#00af3d',
		behind: '#fc4036',
		complete: '#fecbba',
		incomplete: '#6c5efb'
	},
	b: {
		w: 300,
		h: 30,
		s: 3,
		t: 10
	},
	li: {
		w: 75,
		h: 30,
		s: 3,
		r: 3
	}
};

export default Sunburst;
