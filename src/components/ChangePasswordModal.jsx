import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../styles/theme';

const ChangePasswordModal = ({ isOpen, onSuccess }) => {
    console.log("Rendering ChangePasswordModal:", isOpen);
    const { user, updatePassword } = useAuth();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Contraseña actual es requerida';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'Nueva contraseña es requerida';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Mínimo 6 caracteres';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            await updatePassword(
                user.id,
                formData.currentPassword,
                formData.newPassword
            );

            showNotification('Contraseña actualizada exitosamente', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            showNotification(error.message, 'error');
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}}
            title="Cambio de contraseña requerido"
            disableClose={true}
        >
            <form onSubmit={handleSubmit}>
                <div style={{ padding: '20px' }}>
                    <p style={{ marginBottom: '20px', color: colors.text }}>
                        Por seguridad, debe cambiar su contraseña para continuar.
                    </p>

                    {errors.general && (
                        <div style={{
                            backgroundColor: `${colors.danger}20`,
                            color: colors.danger,
                            padding: '10px',
                            borderRadius: '4px',
                            marginBottom: '15px'
                        }}>
                            {errors.general}
                        </div>
                    )}

                    <Input
                        label="Contraseña actual"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        error={errors.currentPassword}
                        style={{ marginBottom: '15px' }}
                        autoFocus
                    />

                    <Input
                        label="Nueva contraseña"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        error={errors.newPassword}
                        style={{ marginBottom: '15px' }}
                    />

                    <Input
                        label="Confirmar nueva contraseña"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        style={{ marginBottom: '20px' }}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                    >
                        Cambiar contraseña
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;