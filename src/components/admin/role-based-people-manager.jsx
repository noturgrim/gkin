import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Users,
  Mail,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  getAssignablePeople,
  createAssignablePerson,
  updateAssignablePerson,
  deleteAssignablePerson,
} from "../../services/assignablePeopleService";

const DEFAULT_ROLES = [
  "Voorganger",
  "Ouderling van dienst",
  "Muzikale begeleiding",
  "Voorzangers",
];

export const RoleBasedPeopleManager = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [showAddForm, setShowAddForm] = useState({});
  const [formData, setFormData] = useState({});
  const [editingPerson, setEditingPerson] = useState(null);
  const [savingRole, setSavingRole] = useState(null);
  const [deletingPerson, setDeletingPerson] = useState(null);

  useEffect(() => {
    fetchPeople();
    // Expand all roles by default
    const expanded = {};
    DEFAULT_ROLES.forEach((role) => {
      expanded[role] = true;
    });
    setExpandedRoles(expanded);
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const data = await getAssignablePeople(false);
      //   console.log("Fetched people:", data);
      setPeople(data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load assignable people");
      setPeople([]);
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role) => {
    setExpandedRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleAddForm = (role) => {
    setShowAddForm((prev) => ({ ...prev, [role]: !prev[role] }));
    setFormData((prev) => ({ ...prev, [role]: { name: "", email: "" } }));
  };

  const handleAddPerson = async (role) => {
    const data = formData[role];
    if (!data?.name?.trim() || !data?.email?.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSavingRole(role);
      await createAssignablePerson({
        name: data.name,
        email: data.email,
        roles: [role],
      });
      setFormData((prev) => ({ ...prev, [role]: { name: "", email: "" } }));
      setShowAddForm((prev) => ({ ...prev, [role]: false }));
      await fetchPeople();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add person");
    } finally {
      setSavingRole(null);
    }
  };

  const handleUpdatePerson = async (personId, currentRoles, role, action) => {
    try {
      let newRoles;
      if (action === "add") {
        newRoles = [...new Set([...currentRoles, role])];
      } else {
        newRoles = currentRoles.filter((r) => r !== role);
      }

      await updateAssignablePerson(personId, { roles: newRoles });
      await fetchPeople();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update person");
    }
  };

  const handleDeletePerson = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`
      )
    ) {
      try {
        setDeletingPerson(id);
        await deleteAssignablePerson(id);
        await fetchPeople();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete person");
      } finally {
        setDeletingPerson(null);
      }
    }
  };

  const getPeopleForRole = (role) => {
    return people.filter(
      (person) =>
        person.roles &&
        Array.isArray(person.roles) &&
        person.roles.includes(role)
    );
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manage People by Role
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manage People by Role
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Manage People by Role
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {DEFAULT_ROLES.map((role) => {
            const rolePeople = getPeopleForRole(role);
            const isExpanded = expandedRoles[role];
            const isAddFormOpen = showAddForm[role];

            return (
              <div key={role} className="border border-gray-200">
                {/* Role Header */}
                <div className="bg-gray-100 p-3 flex items-center justify-between">
                  <button
                    onClick={() => toggleRole(role)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-semibold text-gray-900">{role}</span>
                    <span className="text-sm text-gray-600">
                      ({rolePeople.length}{" "}
                      {rolePeople.length === 1 ? "person" : "people"})
                    </span>
                  </button>
                  <Button
                    onClick={() => toggleAddForm(role)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Person
                  </Button>
                </div>

                {/* Role Content */}
                {isExpanded && (
                  <div className="p-3 space-y-3">
                    {/* Add Person Form */}
                    {isAddFormOpen && (
                      <div className="bg-blue-50 border border-blue-200 p-3 space-y-3">
                        <div>
                          <Label
                            htmlFor={`add-name-${role}`}
                            className="text-sm font-medium"
                          >
                            Name
                          </Label>
                          <Input
                            id={`add-name-${role}`}
                            value={formData[role]?.name || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [role]: { ...prev[role], name: e.target.value },
                              }))
                            }
                            placeholder="Enter person name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`add-email-${role}`}
                            className="text-sm font-medium"
                          >
                            Email
                          </Label>
                          <Input
                            id={`add-email-${role}`}
                            type="email"
                            value={formData[role]?.email || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [role]: {
                                  ...prev[role],
                                  email: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter email address"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddPerson(role)}
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={savingRole === role}
                          >
                            {savingRole === role ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Add
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => toggleAddForm(role)}
                            variant="outline"
                            size="sm"
                            disabled={savingRole === role}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* People List */}
                    {rolePeople.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No people assigned to this role yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rolePeople.map((person) => (
                          <div
                            key={person.id}
                            className="bg-white border border-gray-200 p-3 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {person.name}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Mail className="w-3 h-3" />
                                {person.email}
                              </div>
                              {person.roles && person.roles.length > 1 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Also in:{" "}
                                  {person.roles
                                    .filter((r) => r !== role)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  handleUpdatePerson(
                                    person.id,
                                    person.roles || [],
                                    role,
                                    "remove"
                                  )
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                title="Remove from this role"
                                disabled={deletingPerson === person.id}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeletePerson(person.id, person.name)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                title="Delete person completely"
                                disabled={deletingPerson === person.id}
                              >
                                {deletingPerson === person.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
