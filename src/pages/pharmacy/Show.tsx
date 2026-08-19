import {useParams} from "react-router-dom";

/**
 * PrescriptionShow - Single prescription details page
 *
 * This page displays detailed information about a specific prescription.
 */
function PrescriptionShow() {
    const {id} = useParams<{id: string}>();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Prescription Details</h1>
            <p className="text-gray-600">Prescription ID: {id}</p>
            <p className="text-gray-600 mt-2">
                Add your prescription details, medicines, and dispensing info here
            </p>
        </div>
    );
}

export default PrescriptionShow;
