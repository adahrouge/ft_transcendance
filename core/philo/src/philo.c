/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   philo.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/29 16:23:34 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:24:36 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

int	check_philo_death(t_data *ptr)
{
	int	i;

	i = 0;
	while (i < ptr->philo_nb)
	{
		if (philo_died(ptr->philos + i))
		{
			set_int(&ptr->table_mutex, &ptr->end_simulation, 1);
			write_status(DIED, ptr->philos + i, DEBUG_MODE);
			return (1);
		}
		i++;
	}
	return (0);
}

int	check_philos_full(t_data *ptr)
{
	int	all_full;
	int	i;
	int	this_philo_full;

	i = 0;
	all_full = 1;
	while (i < ptr->philo_nb)
	{
		this_philo_full = get_int(&ptr->philos[i].philo_mutex,
				&ptr->philos[i].full);
		if (!this_philo_full)
		{
			all_full = 0;
			break ;
		}
		i++;
	}
	return (all_full);
}

void	philo_init(t_data *ptr)
{
	t_philo	*p;
	int		i;

	i = 0;
	while (i < ptr->philo_nb)
	{
		p = ptr->philos + i;
		p->id = i + 1;
		p->full = 0;
		p->meals_counter = 0;
		p->last_meal_time = 0;
		p->ptr = ptr;
		safe_mutex_handle(&p->philo_mutex, INIT);
		assign_forks_properly(p, ptr->forks);
		i++;
	}
}
