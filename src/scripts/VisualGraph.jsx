class VisualGraph extends React.Component{
    constructor(props) {
        super(props);
        this.graphLayout = new GraphLayout(this.saveGraph.bind(this));
        this.state = {
            graph: null,
            previousViewBox: null
        };
        this.animate = null
    }

    saveGraph(graph) {
        this.setState({
            graph: graph
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.graph) {
            nextProps.graph._label.rankdir = nextProps.layout;
            this.graphLayout.layout(nextProps.graph);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (this.state !== nextState)
    }

    handleClick(node) {
        console.log("Clicked", node);
        this.setState({
            selectedNode: node.id
        })
        this.animate.beginElement()
    }

    mount(domNode) {
        if (domNode) {
            this.animate = domNode
        }
        this.animate.beginElement()
    }

    render() {
        if (!this.state.graph) {
            // console.log(this.state.graph)
            return null
        }

        let g = this.state.graph;

        let nodes = g.nodes().map(nodeName => {
            let graph = this;
            let n = g.node(nodeName);
            let node = null;
            let props = {
                key: nodeName,
                node: n,
                onClick: graph.handleClick.bind(graph)
            }

            if (n.isMetanode === true) {
                node = <Metanode {...props} />;
            } else {
                if (n.userGeneratedId) {
                    node = <IdentifiedNode {...props} />;
                } else {
                    node = <AnonymousNode {...props} />
                }
            }

            return node;
        });

        let edges = g.edges().map(edgeName => {
            let e = g.edge(edgeName);
            return <Edge key={`${edgeName.v}->${edgeName.w}`} edge={e}/>
        });

        var viewBox_whole = `0 0 ${g.graph().width} ${g.graph().height}`;
        var transformView = `translate(0px,0px)` + `scale(${g.graph().width / g.graph().width},${g.graph().height / g.graph().height})`;
        
        let selectedNode = this.state.selectedNode;
        var viewBox
        if (selectedNode) {
            let n = g.node(selectedNode);
            viewBox = `${n.x - n.width / 2} ${n.y - n.height / 2} ${n.width} ${n.height}`
        } else {
            viewBox = viewBox_whole
        }

        return (
            <svg id="visualization" xmlns="http://www.w3.org/2000/svg" version="1.1">
                <style>
                    {
                        fs.readFileSync("src/bundle.css", "utf-8", (err) => {console.log(err)})
                    }
                </style>
                <animate ref={this.mount.bind(this)} attributeName="viewBox" from={viewBox_whole} to={viewBox} begin="0s" dur="0.25s" fill="freeze" repeatCount="1"></animate>
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="10" markerHeight="7.5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 L 3 5 z" className="arrow"></path>
                    </marker>
                </defs>
                <g id="graph">
                    <g id="nodes">
                        {nodes}
                    </g>
                    <g id="edges">
                        {edges}
                    </g>
                </g>
            </svg>
        );
    }
}

class Edge extends React.Component{
    line = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y)

    constructor(props) {
        super(props);
        this.state = {
            previousPoints: []
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            previousPoints: this.props.edge.points
        });
    }

    mount(domNode) {
        if (domNode) {
            domNode.beginElement()    
        }
    }

    render() {
        let e = this.props.edge;
        let l = this.line;
        return (
            <g className="edge" markerEnd="url(#arrow)">
                <path d={l(e.points)}>
                    <animate ref={this.mount} key={Math.random()} restart="always" from={l(this.state.previousPoints)} to={l(e.points)} begin="0s" dur="0.25s" fill="freeze" repeatCount="1" attributeName="d" />
                </path>
            </g>
        );
    }
}

class Node extends React.Component{
    constructor(props) {
        super(props);
    }
    handleClick() {
        this.props.onClick(this.props.node);
    }
    render() {
        let n = this.props.node;
        const type = n.isMetanode ? "metanode" : "node"

        return (
            <g className={`${type} ${n.class}`} onClick={this.handleClick.bind(this)} transform={`translate(${Math.floor(n.x -(n.width/2))},${Math.floor(n.y -(n.height/2))})`}>
                <rect width={n.width} height={n.height} rx="15px" ry="15px" style={n.style} />
                {this.props.children}
            </g>
        );
    }
}

class Metanode extends Node{
    render() {
        let n = this.props.node;
        return (
            <Node {...this.props}>
                <text transform={`translate(10,0)`} textAnchor="start" style={{dominantBaseline: "ideographic"}}>
                    <tspan x="0" className="id">{n.userGeneratedId}</tspan>
                    <tspan x="0" dy="1.2em">{n.class}</tspan>
                </text>
            </Node>
        );
    }
}

class AnonymousNode extends Node{
    constructor(props) {
        super(props);
    }
    render() {
        let n = this.props.node;
        return (
            <Node {...this.props}>
                <text transform={`translate(${(n.width/2) },${(n.height/2)})`} textAnchor="middle">
                    <tspan>{n.class}</tspan>
                </text>
            </Node>
        );
    }
}

class IdentifiedNode extends Node{
    render() {
        let n = this.props.node;
        return (
            <Node {...this.props}>
                <text transform={`translate(${(n.width/2) },${(n.height/2)})`} textAnchor="middle" style={{dominantBaseline: "ideographic"}}>
                    <tspan x="0" className="id">{n.userGeneratedId}</tspan>
                    <tspan x="0" dy="1.2em">{n.class}</tspan>
                </text>
            </Node>
        );
    }
}