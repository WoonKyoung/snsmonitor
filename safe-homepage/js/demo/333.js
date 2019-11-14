let svg,
    pack,
    bubble,
    simulation;

const width = document.body.clientWidth;
const height = document.body.clientHeight;
const centerX = width * 0.5;
const centerY = height * 0.5;
const scaleColor = d3.scaleOrdinal(d3.schemeCategory20);
let forceCollide = d3.forceCollide(d => d.r + 1); // create a circle collision force.

getData();

function init(data) {
    svg = d3.select("#bubble-word")
        .append('svg')
        .attr("xmlns", "http://www.w3.org/2000/svg");

    // use pack to calculate radius of the circle
    pack = d3.pack()
        .size([width, height])
        .padding(1.5);

    // @v4 strength to apply to the position forces
    const forceStrength = 0.05;

    // @v4 We create a force simulation now and add forces to it.
    // velocityDecay: 默认为 0.4，衰减系数类似于阻力。
    // 较低的衰减系数可以使得迭代次数更多，其布局结果也会更理性，但是可能会引起数值不稳定从而导致震荡
    simulation = d3.forceSimulation()
        // .velocityDecay(0.3)
        .force("x", d3.forceX(centerX).strength(forceStrength))
        .force("y", d3.forceY(centerY).strength(forceStrength))
        .force("charge", d3.forceManyBody())//-Math.pow(d.radius, 2.0) * forceStrength)
        .force("collide", forceCollide);

    // @v4 Force starts up automatically,
    //  which we don't want as there aren't any nodes yet.
    // simulation.stop();

    draw(data);
}

/**
 * @method createNodes 创建节点
 * @param {Object} source
 */
function createNodes(source) {
    let root = d3.hierarchy({ children: source })
        .sum(d => d.value);

    const rootData = pack(root).leaves().map((d, i) => {
        const data = d.data;
        const color = scaleColor(data.name);
        return {
            x: centerX + (d.x - centerX) * 3,
            y: centerY + (d.y - centerY) * 3,
            id: "bubble" + i,
            r: 0,
            radius: d.r,
            value: data.value,
            name: data.name,
            color: color,
        }
    });

    // sort them to prevent occlusion of smaller nodes.
    rootData.sort((a, b) => b.value - a.value);
    return rootData;
}

/**
 * @method draw 绘制bubble，动画初始化
 * @param {Object} data
 */
function draw(data) {
    const nodes = createNodes(data);
    console.log(nodes);

    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes).on("tick", ticked);

    bubble = svg.selectAll(".bubble")
        .data(nodes)
        .enter().append("g")
        .attr("class", "bubble")
        .call(d3.drag()
            .on("start", (d) => {
                if (!d3.event.active) { simulation.alphaTarget(0.2).restart(); }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (d) => {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on("end", (d) => {
                if (!d3.event.active) { simulation.alphaTarget(0); }
                d.fx = null;
                d.fy = null;
            })
        );
        // .on("mouseover", d => {
        //  d3.select("#"+d.id).attr("fill", d3.color(d.color).brighter());
        // }).on("mouseout", d => {
        //  d3.select("#"+d.id).attr("fill", d.color);
        // });

    var href = bubble.append("a")
        .attr("href", d => "http://me.chjiyun.com/#"+d.name)
        .attr("target", "_blank");

    href.append("circle")
        .attr("id", d => d.id)
        .attr("r", 1e-6)
        .attr("fill", d => d.color)
        .transition().duration(2000).ease(d3.easeElasticOut)
        .tween("circleIn", d => {
            let i = d3.interpolateNumber(0, d.radius);
            return (t) => {
                d.r = i(t);
                simulation.force("collide", forceCollide);
            };
        });

    href.append("text")
        .attr("dy", d => "0.35em")
        .text(d => d.name);
}

function getData() {
    d3.json("data/bubble.json", function(err, data) {
        if (err) throw err;

        init(data.data);
    });
}

function ticked() {
    bubble.attr("transform", d => `translate(${d.x},${d.y})`)
        .select("circle")
        .attr("r", d => d.r);
}
