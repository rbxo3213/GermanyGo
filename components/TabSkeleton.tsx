export default function TabSkeleton() {
    return (
        <div className="w-full h-full p-4 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6"></div>

            <div className="h-48 bg-gray-100 rounded-2xl w-full"></div>

            <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
            </div>

            <div className="h-40 bg-gray-100 rounded-2xl w-full mt-4"></div>
        </div>
    );
}
