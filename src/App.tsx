import dpsLogo from './assets/DPS.svg';
import AddressForm from './components/AddressForm';
import './App.css';

const App = () => {
	return (
		<>
			<div>
				<a 
					href="https://www.digitalproductschool.io/" 
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Visit Digital Product School website"
				>
					<img src={dpsLogo} className="logo" alt="DPS logo" />
				</a>
			</div>
			<div className="home-card">
				<AddressForm />
			</div>
		</>
	);
};

export default App;
