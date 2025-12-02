import dpsLogo from './assets/DPS.svg';
import AddressForm from './components/AddressForm';

const App = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen w-full">
			<div className="mb-8">
				<a 
					href="https://www.digitalproductschool.io/" 
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Visit Digital Product School website"
				>
					<img src={dpsLogo} className="logo h-24 w-auto" alt="DPS logo" />
				</a>
			</div>
			<div className="w-full flex justify-center">
				<AddressForm />
			</div>
		</div>
	);
};

export default App;
