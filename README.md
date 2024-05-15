# UKG-API--RaaS-Reports-List
using google apps script - Urlfetch Service -UKG API - To save report list from IBM Cognos to Google Spreadsheet


Things you need
1. UKG PRO SERVICE ACCOUNT
2. <UserName>username</UserName>  
  <Password>password</Password>  
  <ClientAccessKey>12345</ClientAccessKey>  
  <UserAccessKey>01234567890</UserAccessKey>  
  2.1 account information you can find on System Configuration- Service Account Administration and  Web Services
3. Google work space, Sheet Services
4. 
def find_all_managers(employee_data):
    """
    Finds all managers for each employee in a hierarchical structure.

    Args:
        employee_data (list): A 2D list containing employee IDs and manager IDs.
            Each sublist is of the form [employee_id, manager_id].

    Returns:
        dict: A dictionary where the key is the employee ID and the value
            is a list containing all their managers, starting from the top
            and going down the hierarchy.
    """

    manager_map = {}  # Create a dictionary to store manager hierarchy
    for employee_id, manager_id in employee_data:
        manager_map.setdefault(employee_id, []).append(manager_id)

    all_managers = {}
    def find_managers_helper(employee_id):
        """
        Recursive helper function to traverse the manager hierarchy.

        Args:
            employee_id (int): The ID of the employee for whom to find managers.

        Returns:
            list: A list containing all managers for the given employee.
        """
        if employee_id not in manager_map:
            return []  # Base case: No manager found for this employee

        managers = manager_map.get(employee_id, [])  # Get direct managers
        for manager in managers:
            if manager not in all_managers:
                all_managers[manager] = find_managers_helper(manager)  # Recursively find managers for managers
            managers.extend(all_managers[manager])  # Append managers of managers

        return list(set(managers))  # Remove duplicates and return the full manager list

    for employee_id in manager_map:
        all_managers[employee_id] = find_managers_helper(employee_id)

    return all_managers

# Example usage
employee_data = [
    [101, None],  # Employee 101 has no manager
    [102, 101],  # Employee 102 reports to 101
    [103, 102],  # Employee 103 reports to 102
    [104, 101],  # Employee 104 also reports to 101
]

all_managers = find_all_managers(employee_data)
print(all_managers)
