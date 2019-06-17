
### Initialize Project
```sh
# 1. Initialize
sudo npm install -g create-react-app
create-react-app project_name

# 2. open the project in VS-Code
cd project_name && code .

# 3. Start the project locally
yarn start
```

### Functional Component
```javascript
const App = (props) => {
    return ()
}
export default App;
```

### Class Component
```javascript
class App extends React.Component {
    // constructor 1: good place to initialize state
    constructor(props){
        super(props);
        this.state = { a: a_value }
    }

    // constructor 2: good place to initialize state 
    state = {};

    // after mounting the page: good place to do data-loading after mounting
    componentDidMount() {}

    // after updating the page: good place to do date loading after page updating
    componentDidUpdate() {}

    // after unmounting the page: good place to clean up unnecessary resources
    componentWillUnmount() {}

    // render the component
    render(){
        // ...
        return ()
    }
}
export default App;
```

### Import && Export
```javascript
import AnotherComponent from 'AnotherComponent';
import AnotherComponent, {ClassName1} from 'AnotherComponent';
import { ClassName1, FunctionName1} from 'AnotherComponent';
```

```javascript
export default ClassName;
export default FunctionName;
export {ClassNam1, ClassName2, FunctionName1, FunctionName2};
```

### Children Components
```javascript
<ApprovalCard>
    <CommentDetail
        author="Sam"
        timeAgo="Today at 4:45PM"
        content="Nice blog post"
        avatar = {faker.image.avatar()}
    />
</ApprovalCard>
```

```javascript
// compoment ApprovalCard
<div className="content"> {this.props.children} </div>
```

### Fetch User Geo Location
[Geo Location](https://www.udemy.com/react-redux/learn/lecture/12531190#overview)

### React Lifecycle
- Why we use lifecycle methods?

<img style="width: 100%; margin: auto" src="https://cdn-images-1.medium.com/max/2400/1*sn-ftowp0_VVRbeUAFECMA.png "></img>

### Update State
```javascript
this.setState({});
```

### Add Styles
- General
  - Load `CSS` file in `index.js` **OR** Load `CSS` CDN in `index.html`
  - Apply proper `className` to element
- Inline
  - use `style` props: `style: {{...}}` **OR** component specific style method

### Loading Spinner
```javascript
render() {
    if (this.state.xxx === null) return <Spinner/>
}
```

### Default Props
- Simple way
```javascript
{this.props.sth || "hello"}
```
- Better Way
```javascript
const Spinner = () => {} // one component as class or function
Spinner.defaultProps = {};
```


### Define Method in Class
```javascript
class SearchBar extends React.Component {
    // normal definition
    onFormSubmit(event) {
    }
}
```

### Solve `this` Context
- Bind
```javascript
class Car {
    constructor() {
        // guide this to this instance(because this is in the constructor)
        this.drive = this.drive.bind(this);
    }
}
```
- Arrow Function
```javascript
// prerequisite: babel
onFormSubmit = (event) => {}
```
- Inline Arrow Function
```javascript
// normal definition
onFormSubmit(event) {}

// this will cause unpredictable error ❎
<form onSubmit={this.onFormSubmit}/>

// this is proper way ✔️
<form onSubmit={() => this.onFormSubmit()}/>
```

### Render List
```javascript
const ImageList = props => {
    const imageList =  props.images.map( image => {
        return <img key = {image.id} src = {image.urls.regular} />
    })

    return <React.Fragment>{imageList}</React.Fragment>
}
```

### React Ref
```javascript
class ImageCard extends React.Component {
    constructor(props) {
        super(props);
        // 🐂 Core code: initialzie in constructor
        this.imageRef = React.createRef();
    }

    render() {
        return 
        <React.Fragment>
            <div>
                // 🐂 Core code: assign in code.
                <img ref={this.imageRef}>
            </div>
        </React.Fragment>
    }
}
```


### Some Methods
```javascript
event.target.value
event.preventDefault();
addEventListener('load', func);
```

## Resources
[React Express](http://www.react.express/)

## Issues
1. D3 element id: you could directly manipulate the dom through d3 in react.
2. transition is not a function: `import {selet, selectAll} from 'd3-selection'`
3. CORS of axios: add domain in package.json as proxy.