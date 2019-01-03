/**
 * Create new GraphView in container identified by id
 * Adapted from: https://github.com/frayar/GXL_Viewer/blob/master/scripts/controller.js
 */
function graphView(id) {
    return {
        sig: new sigma({
            graph: { nodes: [], edges: [] },
            renderer: {
                container: id,
                type: 'canvas',
            },
            settings: {
                drawLabels: false,
                drawEdgeLabels: false,
                doubleClickEnabled: true,
                minNodeSize: 1,
                maxNodeSize: 2,
                minEdgeSize: 0.1,
                maxEdgeSize: 1,
                sideMargin: 5,
            },
        }),


        /**
         * Function to load features file
         * */
        importGraph(content) {
            // Clear existing graph if re-import
            this.clearGraph();

            // Read content as json graph
            const jsonGraph = this.gxl2json(content);

            // Load as sigmajs graph
            this.sig.graph.read(JSON.parse(jsonGraph));

            // Init the visualisation
            this.init();

            // Display the graph
            this.display();
        },

        /**
         * Function to save as png image
         * */
        saveImage() {
            // Get renderer
            const myRenderer = this.sig.renderers[0];

            // Download the rendered graph as an image
            myRenderer.snapshot({
                format: 'png',
                background: 'white',
                labels: false,
                download: true,
                filename: 'graph.png',
            });
        },


        /**
         * Function to clear the graph
         * */
        clearGraph() {
            /* Resetting the displaying */
            this.sig.graph.clear();

            // Refresh the view
            this.sig.refresh();
        },


        /* ---------------------------- */
        /* IMPORT/EXPORT FUNCTIONS      */
        /* ---------------------------- */

        /**
         * Function that convert a gxl string to json
         * */
        gxl2json(gxl) {
            // Get DOM parser
            const parser = new window.DOMParser();
            const xmlDoc = parser.parseFromString(gxl, 'text/xml');

            // JSON header
            let exportedGraph = '{';
            exportedGraph += '\n\t"directed": false,';
            exportedGraph += '\n\t"graph": [],';
            exportedGraph += '\n\t"multigraph": false,';

            // Getting the <graph>
            const XMLnodes = xmlDoc.firstElementChild.childNodes;
            let indexOfGraph = 0;
            while ((indexOfGraph < XMLnodes.length) && (XMLnodes[indexOfGraph].nodeName !== 'graph')) {
                indexOfGraph++;
            }
            const graphNode = XMLnodes[indexOfGraph].childNodes;

            // Getting nodes and edges
            const nodes = [];
            const edges = [];
            let i = 0;
            while (i < graphNode.length) {
                if (graphNode[i].nodeName === 'node') { nodes.push(graphNode[i]); } else if (graphNode[i].nodeName === 'edge') { edges.push(graphNode[i]); }
                i++;
            }

            // Getting the informations from the nodes
            exportedGraph = '{\n\t"nodes": [';
            for (i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeName === 'node') {
                    const attributes = nodes[i].attributes;
                    const data = nodes[i].childNodes;


                    // Getting the id of the node
                    exportedGraph += '\n\t\t{\n';
                    exportedGraph += `\t\t\t"id": "${attributes.getNamedItem('id').value}",\n`;

                    // Getting the attributes of the node
                    let label = '';
                    const attrs = '';
                    let x_ = '';
                    let y_ = '';
                    for (let j = 0; j < data.length; j++) {
                        if (data[j].nodeName === 'attr') {
                            if (data[j].attributes.getNamedItem('name').value === 'x') {
                                x_ = data[j].firstElementChild.textContent;
                            } else if (data[j].attributes.getNamedItem('name').value === 'y') {
                                y_ = data[j].firstElementChild.textContent;
                            } else {
                                exportedGraph += `\t\t\t"${data[j].attributes.getNamedItem('name').value}": "${data[j].firstElementChild.textContent}",\n`;
                                label += `${data[j].attributes.getNamedItem('name').value} = ${data[j].firstElementChild.textContent} | `;
                            }
                        }
                    }

                    // Reassign label if specified in the input file
                    if (attributes.getNamedItem('label')) { label = attributes.getNamedItem('label').value; }

                    exportedGraph += `\t\t\t"label": "${attrs}",\n`;

                    // Assign default position if not specified ni the input file
                    if (x_ === '') { x_ = Math.random() * 50; }
                    if (y_ === '') { y_ = Math.random() * 50; }

                    // Default values (x and y coordinates, size, color,  and image representative)
                    exportedGraph += `\t\t\t"x": ${x_},\n`;
                    exportedGraph += `\t\t\t"y": ${y_},\n`;
                    exportedGraph += '\t\t\t"size": 1,\n';
                    exportedGraph += '\t\t\t"color": "#000000"\n';

                    // Close node
                    exportedGraph += '\n\t\t},';
                }
            }
            exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);


            // Getting the informations from the edges
            exportedGraph += '\n\t],\n\t"edges": [';
            let nbEdges = 0;
            for (i = 0; i < edges.length; i++) {
                if (edges[i].nodeName === 'edge') {
                    const attributes = edges[i].attributes;
                    const data = edges[i].childNodes;

                    exportedGraph += '\n\t\t{\n';
                    exportedGraph += `${'\t\t\t"id": "e'}${nbEdges}",\n`;
                    exportedGraph += `${'\t\t\t"label": "e'}${nbEdges}",\n`;
                    exportedGraph += `\t\t\t"source": "${attributes.getNamedItem('from').value}",\n`;
                    exportedGraph += `\t\t\t"target": "${attributes.getNamedItem('to').value}",\n`;
                    exportedGraph += '\t\t\t"weight": "1",\n';
                    exportedGraph += '\t\t\t"color": "#000000",\n';
                    exportedGraph += '\t\t\t"size": "1",\n';

                    // Getting the attributes of the edge
                    for (let j = 0; j < data.length; j++) {
                        if (data[j].nodeName === 'attr') { exportedGraph += `\t\t\t"${data[j].attributes.getNamedItem('name').value}": "${data[j].firstElementChild.textContent}",\n`; }
                    }

                    exportedGraph = exportedGraph.substring(0, exportedGraph.length - 2);
                    exportedGraph += '\n\t\t},';

                    nbEdges++;
                }
            }
            exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);

            // Finalizing the JSON string
            exportedGraph += '\n\t]\n}';
            return exportedGraph;
        },


        /* ---------------------------- */
        /* GRAPH UI FUNCTIONS           */
        /* ---------------------------- */

        /** Function to initialize the graph * */
        init() {
            /* Preprocessing each node */
            this.sig.graph.nodes().forEach((n) => {
                // Set the shape of the node as square
                n.type = 'square';

                // Save original attributes
                n.originalColor = (n.color) ? n.color : this.sig.settings('defaultNodeColor');
                n.originalSize = (n.size) ? n.size : this.sig.settings('minNodeSize');
                n.originalLabel = (n.label) ? n.label : '';
            });

            /* Preprocessing each edge */
            this.sig.graph.edges().forEach((e) => {
                // Save original attributes
                e.originalColor = (e.color) ? e.color : this.sig.settings('defaultEdgeColor');
                e.originalSize = (e.size) ? e.size : this.sig.settings('minNodeSize');
                e.originalLabel = (e.label) ? e.label : '';
            });

            // SET LISTENERS
            // When the background is left clicked, not for dragging
            this.sig.bind('clickStage', (e) => {
                if (!e.data.captor.isDragging) {
                    // Resetting the camera
                    sigma.misc.animation.camera(
                        this.sig.camera,
                        {
                            x: 0,
                            y: 0,
                            ratio: 1,
                        },
                        { duration: 300 },
                    );
                }
            });
        },


        /** Function that display a graph that has been load by sigma * */
        display() {
            // Resetting the displaying
            sigma.misc.animation.camera(
                this.sig.camera,
                {
                    x: 0,
                    y: 0,
                    ratio: 1,
                },
                { duration: 1 },
            );

            // Displaying the graph
            this.sig.refresh();
        },
    };
}
