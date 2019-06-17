import React from 'react';
import Sunburst from './components/Sunburst';
import './styles/App.css';
// import getData from './utils/Sunburst';
import axios from 'axios';

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { data: null };
		this.request = axios.create({
			baseURL: '/',
			headers: {
				'x-auth-token': process.env.token
			}
		});
	}

	componentDidMount = () => {
		this.request
			.get('/portfolios/sunburst', { params: { name: 'adelaide airport' } })
			.then((res) => this.setState({ data: res.data }))
			.catch((err) => console.log(err));
	};

	render() {
		const { data } = this.state;
		return <Sunburst radius={200} data={data} />;
	}
}

export default App;
